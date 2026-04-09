import * as cheerio from 'cheerio';
import { ProductData } from '@/lib/types';
import { fetchWithRetry, HEADERS, parsePrice } from '@/lib/scrapers/utils';

export async function searchAjio(query: string): Promise<ProductData[]> {
  const url = `https://www.ajio.com/search/?text=${encodeURIComponent(query)}&start=0&gridColumns=3`;
  console.log('[ajioSearch] searching:', url);

  try {
    const response = await fetchWithRetry(url, {
      headers: {
        ...HEADERS,
        Referer: 'https://www.ajio.com/',
      },
    }, 2);
    const html = await response.text();

    if (html.length < 3000) {
      console.warn('[ajioSearch] thin response');
      return [];
    }

    // Ajio is Next.js — try __NEXT_DATA__
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (nextDataMatch) {
      try {
        const str = JSON.stringify(JSON.parse(nextDataMatch[1]));
        const results: ProductData[] = [];

        // Ajio product list in __NEXT_DATA__ uses "products" array
        const priceMatches = [...str.matchAll(/"name"\s*:\s*"([^"]{5,})"[^}]*?"price"\s*:\s*(\d+)/g)];
        for (const m of priceMatches.slice(0, 5)) {
          results.push({
            name: m[1],
            price: parseInt(m[2], 10),
            mrp: null,
            image: null,
            modelNumber: null,
            category: null,
            store: 'Ajio',
            url,
            rating: null,
            inStock: true,
          });
        }
        if (results.length > 0) {
          console.log(`[ajioSearch] found ${results.length} results via __NEXT_DATA__`);
          return results;
        }
      } catch { /* ignore */ }
    }

    // Selectors fallback
    const $ = cheerio.load(html);
    const results: ProductData[] = [];

    $('[class*="item-container"], [class*="product-item"], [class*="ProductBox"]').each((_, el) => {
      if (results.length >= 5) return false;

      const name =
        $(el).find('[class*="brand"], [class*="name"]').first().text().trim() + ' ' +
        $(el).find('[class*="namecls"], [class*="description"]').first().text().trim();
      if (!name.trim()) return;

      const rawPrice =
        $(el).find('[class*="price"], [class*="sale-price"]').first().text().trim();
      const image = $(el).find('img').first().attr('src') ?? null;
      const href = $(el).find('a').first().attr('href') ?? '';

      results.push({
        name: name.trim(),
        price: parsePrice(rawPrice),
        mrp: null,
        image,
        modelNumber: null,
        category: null,
        store: 'Ajio',
        url: href ? `https://www.ajio.com${href}` : url,
        rating: null,
        inStock: true,
      });
    });

    console.log(`[ajioSearch] found ${results.length} results via selectors`);
    return results;
  } catch (err) {
    console.warn('[ajioSearch] error:', err);
    return [];
  }
}
