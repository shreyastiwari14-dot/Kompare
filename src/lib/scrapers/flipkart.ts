import * as cheerio from 'cheerio';
import { ProductData } from '../types';
import { fetchWithRetry, HEADERS, parsePrice, extractJsonLd } from './utils';

export async function scrapeFlipkart(url: string): Promise<ProductData> {
  console.log('[flipkart] scraping:', url);

  const response = await fetchWithRetry(url, { headers: HEADERS });
  const html = await response.text();
  const $ = cheerio.load(html);

  // ── JSON-LD first (most reliable when available) ──────────────────────────
  const ld = extractJsonLd(html);

  // ── Title ────────────────────────────────────────────────────────────────
  // Flipkart class names are hashed; try multiple known patterns + meta
  const title =
    $('span.VU-ZEz').text().trim() ||
    $('h1.yhB1nd').text().trim() ||
    $('span[class*="title"]').first().text().trim() ||
    $('meta[property="og:title"]').attr('content')?.trim() ||
    (ld?.name as string) ||
    null;

  // ── Price ────────────────────────────────────────────────────────────────
  const rawPrice =
    $('div.Nx9bqj').first().text().trim() ||
    $('div.CEmiEU div.Nx9bqj').first().text().trim() ||
    $('div._30jeq3').first().text().trim() ||
    $('meta[property="product:price:amount"]').attr('content') ||
    null;

  // ── MRP ──────────────────────────────────────────────────────────────────
  const rawMrp =
    $('div.yRaY8j').first().text().trim() ||
    $('div.UOCQB1').first().text().trim() ||
    $('div._3I9_wc').first().text().trim() ||
    null;

  // ── Image ────────────────────────────────────────────────────────────────
  const image =
    $('img.DByuf4').attr('src') ||
    $('img._396cs4').attr('src') ||
    $('meta[property="og:image"]').attr('content') ||
    null;

  // ── In stock ────────────────────────────────────────────────────────────
  const outOfStock = html.toLowerCase().includes('out of stock') ||
                     html.toLowerCase().includes('sold out');
  const inStock = !outOfStock;

  // ── Specs / model ────────────────────────────────────────────────────────
  let modelNumber: string | null = null;
  $('tr._1s_Smc, div._3B3HgG').each((_, row) => {
    const label = $(row).find('td._1hKmbr, td:first-child').text().toLowerCase();
    const value = $(row).find('td.URwL2w, td:last-child').text().trim();
    if ((label.includes('model') || label.includes('model number')) && value) {
      modelNumber = value;
      return false;
    }
  });

  // ── Category ────────────────────────────────────────────────────────────
  const category =
    $('div._1MR4o5 a').last().text().trim() ||
    $('div.r2CdBd a').last().text().trim() ||
    null;

  // ── Rating ───────────────────────────────────────────────────────────────
  const ratingText = $('div.XQDdHH').first().text().trim() ||
                     $('span._2d4LTz').first().text().trim();
  const ratingMatch = ratingText.match(/(\d+(\.\d+)?)/);
  const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;

  console.log('[flipkart] extracted:', { title, rawPrice, rawMrp, inStock, rating });

  return {
    name: title ?? 'Unknown Product',
    price: parsePrice(rawPrice),
    mrp: parsePrice(rawMrp),
    image: image ?? null,
    modelNumber,
    category,
    store: 'Flipkart',
    url,
    rating,
    inStock,
  };
}
