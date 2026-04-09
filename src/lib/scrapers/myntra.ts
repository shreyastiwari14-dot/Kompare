import * as cheerio from 'cheerio';
import { ProductData } from '../types';
import { fetchWithRetry, HEADERS, parsePrice, extractJsonLd } from './utils';

export async function scrapeMyntra(url: string): Promise<ProductData> {
  console.log('[myntra] scraping:', url);

  const response = await fetchWithRetry(url, {
    headers: {
      ...HEADERS,
      Referer: 'https://www.myntra.com/',
      'sec-ch-ua': '"Chromium";v="126", "Google Chrome";v="126"',
    },
  });
  const html = await response.text();
  console.log(`[myntra] status: ${response.status}, length: ${html.length}`);

  // ── JSON-LD (sometimes present) ───────────────────────────────────────────
  const ld = extractJsonLd(html);
  if (ld) {
    const offers = ld.offers as Record<string, unknown> | undefined;
    const name = ld.name as string | undefined;
    const price = parsePrice(String(offers?.price ?? ''));
    if (name && price) {
      console.log('[myntra] extracted via JSON-LD:', name);
      return {
        name,
        price,
        mrp: parsePrice(String(offers?.highPrice ?? '')),
        image: (Array.isArray(ld.image) ? ld.image[0] : ld.image) as string || null,
        modelNumber: null,
        category: ld.category as string || null,
        store: 'Myntra',
        url,
        rating: ld.aggregateRating
          ? parseFloat(String((ld.aggregateRating as Record<string, unknown>).ratingValue ?? 0))
          : null,
        inStock: !String(offers?.availability ?? '').includes('OutOfStock'),
      };
    }
  }

  // ── Myntra embeds product data as window.__myx or pdpData ─────────────────
  const patterns = [
    /window\.__myx\s*=\s*({[\s\S]*?});\s*(?:window|<\/script>)/,
    /window\.pdpData\s*=\s*({[\s\S]*?});\s*(?:window|<\/script>)/,
    /"pdpData"\s*:\s*({[\s\S]*?})(?:,\s*"|\})/,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      try {
        const data = JSON.parse(match[1]) as Record<string, unknown>;
        const str = JSON.stringify(data);
        const nameMatch = str.match(/"(?:name|productName)"\s*:\s*"([^"]{3,})"/);
        const priceMatch = str.match(/"(?:price|discountedPrice|sellingPrice)"\s*:\s*(\d+)/);
        const mrpMatch = str.match(/"(?:mrp|originalPrice)"\s*:\s*(\d+)/);
        const imgMatch = str.match(/"(?:imageUrl|images|image)"\s*:\s*"(https?:[^"]+)"/);

        const name = nameMatch?.[1];
        const price = priceMatch ? parseInt(priceMatch[1], 10) : null;
        if (name && price) {
          console.log('[myntra] extracted via window data:', name);
          return {
            name,
            price,
            mrp: mrpMatch ? parseInt(mrpMatch[1], 10) : null,
            image: imgMatch?.[1] ?? null,
            modelNumber: null,
            category: null,
            store: 'Myntra',
            url,
            rating: null,
            inStock: !str.includes('"outOfStock":true'),
          };
        }
      } catch { /* ignore */ }
    }
  }

  // ── __NEXT_DATA__ ─────────────────────────────────────────────────────────
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (nextDataMatch) {
    try {
      const str = JSON.stringify(JSON.parse(nextDataMatch[1]));
      const nameMatch = str.match(/"(?:name|productName)"\s*:\s*"([^"]{3,})"/);
      const priceMatch = str.match(/"(?:price|discountedPrice)"\s*:\s*(\d+)/);
      const mrpMatch = str.match(/"(?:mrp|originalPrice)"\s*:\s*(\d+)/);
      const imgMatch = str.match(/"(?:imageUrl|src)"\s*:\s*"(https?:[^"]+)"/);
      const name = nameMatch?.[1];
      const price = priceMatch ? parseInt(priceMatch[1], 10) : null;
      if (name && price) {
        console.log('[myntra] extracted via __NEXT_DATA__:', name);
        return {
          name,
          price,
          mrp: mrpMatch ? parseInt(mrpMatch[1], 10) : null,
          image: imgMatch?.[1] ?? null,
          modelNumber: null,
          category: null,
          store: 'Myntra',
          url,
          rating: null,
          inStock: true,
        };
      }
    } catch { /* ignore */ }
  }

  // ── Selectors fallback ────────────────────────────────────────────────────
  const $ = cheerio.load(html);
  const name = $('h1.pdp-title').text().trim() ||
               $('meta[property="og:title"]').attr('content')?.trim() ||
               null;
  const rawPrice = $('span.pdp-price strong').text().trim() ||
                   $('[class*="price-value"]').first().text().trim() ||
                   null;

  console.log('[myntra] extracted via selectors:', { name, rawPrice });

  return {
    name: name ?? 'Unknown Product',
    price: parsePrice(rawPrice),
    mrp: null,
    image: $('meta[property="og:image"]').attr('content') || null,
    modelNumber: null,
    category: null,
    store: 'Myntra',
    url,
    rating: null,
    inStock: !html.includes('COMING_SOON') && !html.includes('out of stock'),
  };
}
