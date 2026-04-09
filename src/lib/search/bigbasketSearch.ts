import * as cheerio from 'cheerio';
import { ProductData } from '@/lib/types';
import { fetchWithRetry, HEADERS, parsePrice } from '@/lib/scrapers/utils';

export async function searchBigbasket(query: string): Promise<ProductData[]> {
  const url = `https://www.bigbasket.com/ps/?q=${encodeURIComponent(query)}&nc=as`;
  console.log('[bigbasketSearch] searching:', url);

  try {
    const response = await fetchWithRetry(url, {
      headers: {
        ...HEADERS,
        Referer: 'https://www.bigbasket.com/',
        'sec-ch-ua': '"Chromium";v="126", "Google Chrome";v="126"',
      },
    }, 2);
    const html = await response.text();

    if (html.length < 3000) {
      console.warn('[bigbasketSearch] thin response, likely blocked');
      return [];
    }

    // BigBasket is a React SPA — try extracting from embedded JSON
    const scriptMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});\s*(?:window|<\/script>)/);
    if (scriptMatch) {
      try {
        const str = JSON.stringify(JSON.parse(scriptMatch[1]));
        const results: ProductData[] = [];
        const productMatches = [...str.matchAll(/"desc"\s*:\s*"([^"]{3,})".*?"sp"\s*:\s*([\d.]+)/g)];
        for (const m of productMatches.slice(0, 5)) {
          results.push({
            name: m[1],
            price: parseFloat(m[2]),
            mrp: null,
            image: null,
            modelNumber: null,
            category: null,
            store: 'BigBasket',
            url: `https://www.bigbasket.com/ps/?q=${encodeURIComponent(query)}`,
            rating: null,
            inStock: true,
          });
        }
        if (results.length > 0) {
          console.log(`[bigbasketSearch] found ${results.length} results via __INITIAL_STATE__`);
          return results;
        }
      } catch { /* ignore */ }
    }

    // JSON-LD scan in the page
    const ldMatches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    const results: ProductData[] = [];
    for (const m of ldMatches) {
      if (results.length >= 5) break;
      try {
        const data = JSON.parse(m[1]);
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          if (item['@type'] === 'Product' && item.name) {
            const offers = item.offers as Record<string, unknown> | undefined;
            results.push({
              name: item.name as string,
              price: parsePrice(String(offers?.price ?? '')),
              mrp: null,
              image: (Array.isArray(item.image) ? item.image[0] : item.image) as string || null,
              modelNumber: null,
              category: null,
              store: 'BigBasket',
              url: `https://www.bigbasket.com/ps/?q=${encodeURIComponent(query)}`,
              rating: null,
              inStock: true,
            });
          }
        }
      } catch { /* skip */ }
    }

    // Selectors fallback
    if (results.length === 0) {
      const $ = cheerio.load(html);
      $('[class*="product-card"], [class*="SKULink"], li[class*="item"]').each((_, el) => {
        if (results.length >= 5) return false;
        const name = $(el).find('[class*="product-desc"], [class*="name"]').first().text().trim();
        if (!name) return;
        const rawPrice = $(el).find('[class*="price"], [class*="sp"]').first().text().trim();
        const image = $(el).find('img').first().attr('src') ?? null;
        results.push({
          name,
          price: parsePrice(rawPrice),
          mrp: null,
          image,
          modelNumber: null,
          category: null,
          store: 'BigBasket',
          url: `https://www.bigbasket.com/ps/?q=${encodeURIComponent(query)}`,
          rating: null,
          inStock: true,
        });
      });
    }

    console.log(`[bigbasketSearch] found ${results.length} results`);
    return results;
  } catch (err) {
    console.warn('[bigbasketSearch] error:', err);
    return [];
  }
}
