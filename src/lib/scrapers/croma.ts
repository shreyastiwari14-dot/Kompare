import * as cheerio from 'cheerio';
import { ProductData } from '../types';
import { fetchWithRetry, HEADERS, parsePrice, extractJsonLd } from './utils';

export async function scrapeCroma(url: string): Promise<ProductData> {
  console.log('[croma] scraping:', url);

  const response = await fetchWithRetry(url, { headers: HEADERS });
  const html = await response.text();
  console.log(`[croma] status: ${response.status}, length: ${html.length}`);

  const $ = cheerio.load(html);

  // ── JSON-LD first ─────────────────────────────────────────────────────────
  const ld = extractJsonLd(html);
  if (ld) {
    const offers = ld.offers as Record<string, unknown> | undefined;
    const name = ld.name as string | undefined;
    const price = parsePrice(String(offers?.price ?? ''));
    const image = (Array.isArray(ld.image) ? ld.image[0] : ld.image) as string | undefined;
    if (name && price) {
      console.log('[croma] extracted via JSON-LD:', name);
      return {
        name,
        price,
        mrp: parsePrice(String(offers?.highPrice ?? '')),
        image: image || null,
        modelNumber: null,
        category: null,
        store: 'Croma',
        url,
        rating: ld.aggregateRating
          ? parseFloat(String((ld.aggregateRating as Record<string, unknown>).ratingValue ?? 0))
          : null,
        inStock: !String(offers?.availability ?? '').includes('OutOfStock'),
      };
    }
  }

  // ── Meta og: tags (often present even without JSON-LD) ───────────────────
  const ogTitle = $('meta[property="og:title"]').attr('content')?.trim();
  const ogPrice = $('meta[property="product:price:amount"]').attr('content');
  const ogImage = $('meta[property="og:image"]').attr('content');

  // ── Selectors ─────────────────────────────────────────────────────────────
  const name =
    $('h1.pdp-name').text().trim() ||
    $('h1[class*="pdp"]').text().trim() ||
    $('h1').first().text().trim() ||
    ogTitle ||
    null;

  const rawPrice =
    $('span.pdp-offer-price').text().trim() ||
    $('span[class*="offer-price"]').first().text().trim() ||
    $('span[class*="selling-price"]').first().text().trim() ||
    ogPrice ||
    null;

  const rawMrp =
    $('span.pdp-m-price').text().trim() ||
    $('span[class*="market-price"]').first().text().trim() ||
    $('s, del').first().text().trim() ||
    null;

  const image =
    $('img.pdp-main-image, img[class*="pdp-image"]').first().attr('src') ||
    ogImage ||
    null;

  const ratingText = $('[class*="rating-count"], [class*="review-rating"]').first().text().trim();
  const ratingMatch = ratingText.match(/(\d+(\.\d+)?)/);

  console.log('[croma] extracted via selectors:', { name, rawPrice });

  return {
    name: name ?? 'Unknown Product',
    price: parsePrice(rawPrice),
    mrp: parsePrice(rawMrp),
    image: image ?? null,
    modelNumber: null,
    category: null,
    store: 'Croma',
    url,
    rating: ratingMatch ? parseFloat(ratingMatch[1]) : null,
    inStock: !html.toLowerCase().includes('currently unavailable') &&
             !html.toLowerCase().includes('out of stock'),
  };
}
