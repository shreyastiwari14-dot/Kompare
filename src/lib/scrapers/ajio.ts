import * as cheerio from 'cheerio';
import { ProductData } from '../types';
import { fetchWithRetry, HEADERS, parsePrice, extractJsonLd } from './utils';

export async function scrapeAjio(url: string): Promise<ProductData> {
  console.log('[ajio] scraping:', url);

  const response = await fetchWithRetry(url, { headers: HEADERS });
  const html = await response.text();
  console.log(`[ajio] status: ${response.status}, length: ${html.length}`);

  // ── JSON-LD first ─────────────────────────────────────────────────────────
  const ld = extractJsonLd(html);
  if (ld) {
    const offers = ld.offers as Record<string, unknown> | undefined;
    const name = ld.name as string | undefined;
    const price = parsePrice(String(offers?.price ?? ''));
    if (name && price) {
      console.log('[ajio] extracted via JSON-LD:', name);
      return {
        name,
        price,
        mrp: parsePrice(String(offers?.highPrice ?? '')),
        image: (Array.isArray(ld.image) ? ld.image[0] : ld.image) as string || null,
        modelNumber: null,
        category: ld.category as string || null,
        store: 'Ajio',
        url,
        rating: null,
        inStock: !String(offers?.availability ?? '').includes('OutOfStock'),
      };
    }
  }

  // ── __NEXT_DATA__ (Ajio is Next.js) ────────────────────────────────────────
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (nextDataMatch) {
    try {
      const str = JSON.stringify(JSON.parse(nextDataMatch[1]));
      const nameMatch = str.match(/"(?:name|productName|title)"\s*:\s*"([^"]{3,})"/);
      const priceMatch = str.match(/"(?:price|discountedPrice|sellingPrice)"\s*:\s*(\d+)/);
      const mrpMatch = str.match(/"(?:mrp|originalPrice|listPrice)"\s*:\s*(\d+)/);
      const imgMatch = str.match(/"(?:imageURL|imageUrl|src)"\s*:\s*"(https?:[^"]+)"/);

      const name = nameMatch?.[1];
      const price = priceMatch ? parseInt(priceMatch[1], 10) : null;
      if (name && price) {
        console.log('[ajio] extracted via __NEXT_DATA__:', name);
        return {
          name,
          price,
          mrp: mrpMatch ? parseInt(mrpMatch[1], 10) : null,
          image: imgMatch?.[1] ?? null,
          modelNumber: null,
          category: null,
          store: 'Ajio',
          url,
          rating: null,
          inStock: !str.includes('"outOfStock":true'),
        };
      }
    } catch { /* ignore */ }
  }

  // ── Ajio window variable ──────────────────────────────────────────────────
  const dataMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});<\/script>/);
  if (dataMatch) {
    try {
      const str = JSON.stringify(JSON.parse(dataMatch[1]));
      const nameMatch = str.match(/"(?:name|productName)"\s*:\s*"([^"]{3,})"/);
      const priceMatch = str.match(/"(?:price|discountedPrice)"\s*:\s*(\d+)/);
      const mrpMatch = str.match(/"(?:mrp|originalPrice)"\s*:\s*(\d+)/);
      const name = nameMatch?.[1];
      const price = priceMatch ? parseInt(priceMatch[1], 10) : null;
      if (name && price) {
        console.log('[ajio] extracted via __INITIAL_STATE__:', name);
        return {
          name,
          price,
          mrp: mrpMatch ? parseInt(mrpMatch[1], 10) : null,
          image: null,
          modelNumber: null,
          category: null,
          store: 'Ajio',
          url,
          rating: null,
          inStock: true,
        };
      }
    } catch { /* ignore */ }
  }

  // ── Selectors fallback ────────────────────────────────────────────────────
  const $ = cheerio.load(html);
  const name =
    $('h1[class*="prod-name"], h1[class*="product-name"]').first().text().trim() ||
    $('meta[property="og:title"]').attr('content')?.trim() ||
    null;
  const rawPrice =
    $('[class*="prod-price"], [class*="prod-sp"]').first().text().trim() ||
    $('meta[property="product:price:amount"]').attr('content') ||
    null;
  const rawMrp =
    $('[class*="prod-mrp"] span').first().text().trim() ||
    $('s, del').first().text().trim() ||
    null;

  console.log('[ajio] extracted via selectors:', { name, rawPrice });

  return {
    name: name ?? 'Unknown Product',
    price: parsePrice(rawPrice),
    mrp: parsePrice(rawMrp),
    image: $('meta[property="og:image"]').attr('content') || null,
    modelNumber: null,
    category: null,
    store: 'Ajio',
    url,
    rating: null,
    inStock: true,
  };
}
