import * as cheerio from 'cheerio';
import { ProductData } from '@/lib/types';
import { fetchWithRetry, HEADERS, parsePrice } from '@/lib/scrapers/utils';

export async function searchCroma(query: string): Promise<ProductData[]> {
  const url = `https://www.croma.com/searchB?q=${encodeURIComponent(query)}%3Arelevance&text=${encodeURIComponent(query)}`;
  console.log('[cromaSearch] searching:', url);

  try {
    const response = await fetchWithRetry(url, { headers: HEADERS }, 2);
    const html = await response.text();

    if (html.length < 3000) {
      console.warn('[cromaSearch] thin response, likely blocked');
      return [];
    }

    const $ = cheerio.load(html);
    const results: ProductData[] = [];

    // Croma uses li.product-item or div.cp-product
    const containers = $('li.product-item, .cp-product, .plp-prod-title').closest('li, div.product-item');
    const items = containers.length ? containers : $('[data-id]');

    items.each((_, el) => {
      if (results.length >= 5) return false;

      const name = $(el).find('.product-title, .plp-prod-title, h3').first().text().trim();
      if (!name) return;

      const rawPrice = $(el).find('.new-price, .amount, [data-price]').first().text().trim();
      const image = $(el).find('img').first().attr('src') ?? null;
      const href = $(el).find('a').first().attr('href') ?? '';
      const productUrl = href.startsWith('http') ? href : `https://www.croma.com${href}`;

      // Extract product ID from URL
      const idMatch = productUrl.match(/\/p\/(\d+)/);

      results.push({
        name,
        price: parsePrice(rawPrice),
        mrp: null,
        image,
        modelNumber: idMatch?.[1] ?? null,
        category: null,
        store: 'Croma',
        url: productUrl,
        rating: null,
        inStock: true,
      });
    });

    console.log(`[cromaSearch] found ${results.length} results`);
    return results;
  } catch (err) {
    console.warn('[cromaSearch] error:', err);
    return [];
  }
}
