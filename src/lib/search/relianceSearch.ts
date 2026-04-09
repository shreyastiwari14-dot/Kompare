import * as cheerio from 'cheerio';
import { ProductData } from '@/lib/types';
import { fetchWithRetry, HEADERS, parsePrice } from '@/lib/scrapers/utils';

export async function searchReliance(query: string): Promise<ProductData[]> {
  const url = `https://www.reliancedigital.in/search?q=${encodeURIComponent(query)}&start=0`;
  console.log('[relianceSearch] searching:', url);

  try {
    const response = await fetchWithRetry(url, { headers: HEADERS }, 2);
    const html = await response.text();

    if (html.length < 3000) {
      console.warn('[relianceSearch] thin response, likely blocked');
      return [];
    }

    const $ = cheerio.load(html);
    const results: ProductData[] = [];

    // Reliance Digital uses a grid of product cards
    $('[class*="product-grid__item"], [class*="ProductContainer"], li[class*="plp"]').each((_, el) => {
      if (results.length >= 5) return false;

      const name =
        $(el).find('[class*="product__title"], [class*="product-name"], p[class*="name"]').first().text().trim() ||
        $(el).find('a').first().attr('title')?.trim();
      if (!name) return;

      const rawPrice =
        $(el).find('[class*="offer-price"], [class*="offerPrice"], [class*="selling"]').first().text().trim() ||
        $(el).find('[class*="price"]').first().text().trim();

      const image = $(el).find('img').first().attr('src') ?? null;
      const href = $(el).find('a').first().attr('href') ?? '';
      const productUrl = href.startsWith('http') ? href : `https://www.reliancedigital.in${href}`;

      results.push({
        name,
        price: parsePrice(rawPrice),
        mrp: null,
        image,
        modelNumber: null,
        category: null,
        store: 'Reliance Digital',
        url: productUrl,
        rating: null,
        inStock: true,
      });
    });

    // Fallback: try extracting from __NEXT_DATA__ if selectors didn't work
    if (results.length === 0) {
      const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
      if (nextDataMatch) {
        try {
          const data = JSON.parse(nextDataMatch[1]);
          const str = JSON.stringify(data);
          // Look for product arrays in the JSON
          const productArrayMatch = str.match(/"products"\s*:\s*(\[[\s\S]*?\])/);
          if (productArrayMatch) {
            const products = JSON.parse(productArrayMatch[1]) as Array<Record<string, unknown>>;
            for (const p of products.slice(0, 5)) {
              const name = (p.name ?? p.productName ?? p.title) as string | undefined;
              const price = p.offerPrice ?? p.sellingPrice ?? p.price;
              if (name && price) {
                results.push({
                  name,
                  price: typeof price === 'number' ? price : parsePrice(String(price)),
                  mrp: null,
                  image: (p.image ?? p.imageUrl ?? null) as string | null,
                  modelNumber: null,
                  category: null,
                  store: 'Reliance Digital',
                  url: `https://www.reliancedigital.in/search?q=${encodeURIComponent(query)}`,
                  rating: null,
                  inStock: true,
                });
              }
            }
          }
        } catch { /* ignore */ }
      }
    }

    console.log(`[relianceSearch] found ${results.length} results`);
    return results;
  } catch (err) {
    console.warn('[relianceSearch] error:', err);
    return [];
  }
}
