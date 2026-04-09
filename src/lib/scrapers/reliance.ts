import * as cheerio from 'cheerio';
import { ProductData } from '../types';
import { fetchWithRetry, HEADERS, parsePrice, extractJsonLd } from './utils';

export async function scrapeReliance(url: string): Promise<ProductData> {
  console.log('[reliance] scraping:', url);

  const response = await fetchWithRetry(url, { headers: HEADERS });
  const html = await response.text();
  console.log(`[reliance] status: ${response.status}, length: ${html.length}`);

  const $ = cheerio.load(html);

  // ── JSON-LD first ─────────────────────────────────────────────────────────
  const ld = extractJsonLd(html);
  if (ld) {
    const offers = ld.offers as Record<string, unknown> | undefined;
    const name = ld.name as string | undefined;
    const price = parsePrice(String(offers?.price ?? ''));
    if (name && price) {
      console.log('[reliance] extracted via JSON-LD:', name);
      return {
        name,
        price,
        mrp: parsePrice(String(offers?.highPrice ?? '')),
        image: (Array.isArray(ld.image) ? ld.image[0] : ld.image) as string || null,
        modelNumber: null,
        category: null,
        store: 'Reliance Digital',
        url,
        rating: null,
        inStock: !String(offers?.availability ?? '').includes('OutOfStock'),
      };
    }
  }

  // ── __NEXT_DATA__ (Reliance is Next.js) ────────────────────────────────────
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (nextDataMatch) {
    try {
      const str = JSON.stringify(JSON.parse(nextDataMatch[1]));
      const nameMatch = str.match(/"(?:name|productName|title)"\s*:\s*"([^"]{3,})"/);
      const priceMatch = str.match(/"(?:price|offerPrice|sellingPrice)"\s*:\s*"?(\d+)"?/);
      const mrpMatch = str.match(/"(?:mrp|originalPrice|listPrice)"\s*:\s*"?(\d+)"?/);
      const imgMatch = str.match(/"(?:image|imageUrl|thumbnail)"\s*:\s*"(https?:[^"]+)"/);

      const name = nameMatch?.[1];
      const price = priceMatch ? parseInt(priceMatch[1], 10) : null;

      if (name && price) {
        console.log('[reliance] extracted via __NEXT_DATA__:', name);
        return {
          name,
          price,
          mrp: mrpMatch ? parseInt(mrpMatch[1], 10) : null,
          image: imgMatch?.[1] ?? null,
          modelNumber: null,
          category: null,
          store: 'Reliance Digital',
          url,
          rating: null,
          inStock: true,
        };
      }
    } catch { /* ignore */ }
  }

  // ── Selectors fallback ────────────────────────────────────────────────────
  const name =
    $('h1.pdp__title, h1[class*="product-title"], h1[class*="pdp"]').first().text().trim() ||
    $('meta[property="og:title"]').attr('content')?.trim() ||
    null;

  const rawPrice =
    $('[class*="offer-price"], [class*="offerPrice"]').first().text().trim() ||
    $('[class*="selling-price"]').first().text().trim() ||
    $('meta[property="product:price:amount"]').attr('content') ||
    null;

  const rawMrp =
    $('[class*="mrp"], [class*="market-price"]').first().text().trim() ||
    $('s, del').first().text().trim() ||
    null;

  console.log('[reliance] extracted via selectors:', { name, rawPrice });

  return {
    name: name ?? 'Unknown Product',
    price: parsePrice(rawPrice),
    mrp: parsePrice(rawMrp),
    image: $('meta[property="og:image"]').attr('content') || null,
    modelNumber: null,
    category: null,
    store: 'Reliance Digital',
    url,
    rating: null,
    inStock: !html.toLowerCase().includes('out of stock'),
  };
}
