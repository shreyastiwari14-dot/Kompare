import * as cheerio from 'cheerio';
import { ProductData } from '../types';
import { fetchWithRetry, HEADERS, parsePrice, extractJsonLd } from './utils';

export async function scrapeAmazon(url: string): Promise<ProductData> {
  console.log('[amazon] scraping:', url);

  const response = await fetchWithRetry(url, {
    headers: {
      ...HEADERS,
      // Amazon desktop hints
      'Device-Memory': '8',
      'Viewport-Width': '1280',
      'DNT': '1',
    },
  });

  const html = await response.text();
  console.log(`[amazon] response status: ${response.status}, html length: ${html.length}`);

  // Detect CAPTCHA / bot-detection page
  const isCaptcha = html.includes('captcha') || html.includes('robot') || html.includes('Sorry, we just need to make sure');
  if (isCaptcha) {
    console.warn('[amazon] CAPTCHA/bot-detection page received');
    throw new Error('Amazon blocked the request (CAPTCHA). Try again later or use a different URL format.');
  }

  const $ = cheerio.load(html);

  // ── Unavailability check ────────────────────────────────────────────────
  const unavailableText = $('#availability span').text().toLowerCase();
  const inStock = !unavailableText.includes('unavailable') &&
                  !unavailableText.includes('out of stock') &&
                  !unavailableText.includes('currently unavailable');

  // ── Title ────────────────────────────────────────────────────────────────
  const title =
    $('#productTitle').text().trim() ||
    $('h1#title span').text().trim() ||
    $('meta[name="title"]').attr('content')?.trim() ||
    null;

  // ── Price (multiple layout fallbacks) ───────────────────────────────────
  const priceSelectors = [
    '#priceblock_ourprice',
    '#priceblock_dealprice',
    '.a-price .a-offscreen',
    '.a-price-whole',
    '#corePrice_feature_div .a-offscreen',
    '#apex_offerDisplay_desktop .a-offscreen',
  ];
  let rawPrice: string | null = null;
  for (const sel of priceSelectors) {
    const val = $(sel).first().text().trim();
    if (val) { rawPrice = val; break; }
  }

  // ── MRP ──────────────────────────────────────────────────────────────────
  const rawMrp =
    $('.a-text-price .a-offscreen').first().text().trim() ||
    $('#listPrice').text().trim() ||
    null;

  // ── Image ────────────────────────────────────────────────────────────────
  let image: string | null = null;
  const imgData = $('#landingImage').attr('data-a-dynamic-image') ||
                  $('#imgBlkFront').attr('data-a-dynamic-image');
  if (imgData) {
    try {
      const imgMap: Record<string, unknown> = JSON.parse(imgData);
      image = Object.keys(imgMap)[0] ?? null;
    } catch { /* ignore */ }
  }
  if (!image) image = $('#landingImage').attr('src') ?? null;
  if (!image) image = $('img#main-image').attr('src') ?? null;

  // ── Model number ─────────────────────────────────────────────────────────
  let modelNumber: string | null = null;
  $('#productDetails_techSpec_section_1 tr, #productDetails_detailBullets_sections1 tr').each((_, row) => {
    const label = $(row).find('th').text().toLowerCase();
    if (label.includes('model') || label.includes('asin')) {
      modelNumber = $(row).find('td').text().trim();
      return false; // break
    }
  });
  // Fallback: detail bullets
  if (!modelNumber) {
    $('li:contains("ASIN"), li:contains("Item model number")').each((_, li) => {
      const text = $(li).text();
      const match = text.match(/:\s*(.+)/);
      if (match) { modelNumber = match[1].trim(); return false; }
    });
  }

  // ── Category ─────────────────────────────────────────────────────────────
  const category =
    $('#wayfinding-breadcrumbs_feature_div a').last().text().trim() ||
    $('a.nav-a.nav-b').first().text().trim() ||
    null;

  // ── Rating ───────────────────────────────────────────────────────────────
  const ratingText =
    $('#acrPopover').attr('title') ||
    $('span[data-hook="rating-out-of-text"]').text().trim() ||
    $('i.a-icon-star span.a-icon-alt').first().text().trim();
  const ratingMatch = ratingText?.match(/(\d+(\.\d+)?)/);
  const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;

  // ── JSON-LD fallback for anything still missing ───────────────────────────
  const ld = extractJsonLd(html);
  const ldPrice = ld?.offers
    ? parsePrice((ld.offers as Record<string, unknown>)?.['price'] as string)
    : null;

  console.log('[amazon] extracted:', { title, rawPrice, rawMrp, inStock, rating });

  return {
    name: title ?? (ld?.name as string) ?? 'Unknown Product',
    price: parsePrice(rawPrice) ?? ldPrice,
    mrp: parsePrice(rawMrp),
    image,
    modelNumber,
    category,
    store: 'Amazon',
    url,
    rating,
    inStock,
  };
}
