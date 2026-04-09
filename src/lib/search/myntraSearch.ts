import * as cheerio from 'cheerio';
import { ProductData } from '@/lib/types';
import { fetchWithRetry, HEADERS, parsePrice } from '@/lib/scrapers/utils';

export async function searchMyntra(query: string): Promise<ProductData[]> {
  // Myntra search URL: keyword search
  const slug = query.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const url = `https://www.myntra.com/${slug}?rawQuery=${encodeURIComponent(query)}`;
  console.log('[myntraSearch] searching:', url);

  try {
    const response = await fetchWithRetry(url, {
      headers: {
        ...HEADERS,
        Referer: 'https://www.myntra.com/',
      },
    }, 2);
    const html = await response.text();

    if (html.length < 3000) {
      console.warn('[myntraSearch] thin response');
      return [];
    }

    // Myntra is heavily JS-rendered. Try __NEXT_DATA__ or window data
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (nextDataMatch) {
      try {
        const str = JSON.stringify(JSON.parse(nextDataMatch[1]));
        // Try to find product listing arrays
        const results: ProductData[] = [];
        const productMatches = str.matchAll(/"(?:productName|name)"\s*:\s*"([^"]{5,})".*?"(?:price|discountedPrice)"\s*:\s*(\d+)/g);
        for (const m of productMatches) {
          if (results.length >= 5) break;
          results.push({
            name: m[1],
            price: parseInt(m[2], 10),
            mrp: null,
            image: null,
            modelNumber: null,
            category: null,
            store: 'Myntra',
            url: `https://www.myntra.com/${slug}`,
            rating: null,
            inStock: true,
          });
        }
        if (results.length > 0) {
          console.log(`[myntraSearch] found ${results.length} results via __NEXT_DATA__`);
          return results;
        }
      } catch { /* ignore */ }
    }

    // Fallback: try cheerio selectors (works if SSR or prerendered)
    const $ = cheerio.load(html);
    const results: ProductData[] = [];

    $('li.product-base, [class*="product-base"], [class*="ProductCard"]').each((_, el) => {
      if (results.length >= 5) return false;

      const name =
        $(el).find('[class*="product-brand"], [class*="brand"]').text().trim() + ' ' +
        $(el).find('[class*="product-product"], [class*="product-description"]').text().trim();
      if (!name.trim()) return;

      const rawPrice =
        $(el).find('[class*="product-discountedPrice"], strong').first().text().trim() ||
        $(el).find('[class*="product-price"]').first().text().trim();

      const image = $(el).find('img').first().attr('src') ?? null;
      const href = $(el).find('a').first().attr('href') ?? '';

      results.push({
        name: name.trim(),
        price: parsePrice(rawPrice),
        mrp: null,
        image,
        modelNumber: null,
        category: null,
        store: 'Myntra',
        url: href ? `https://www.myntra.com${href}` : url,
        rating: null,
        inStock: true,
      });
    });

    console.log(`[myntraSearch] found ${results.length} results via selectors`);
    return results;
  } catch (err) {
    console.warn('[myntraSearch] error:', err);
    return [];
  }
}
