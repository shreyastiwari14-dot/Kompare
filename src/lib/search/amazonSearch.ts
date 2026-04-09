import * as cheerio from 'cheerio';
import { ProductData } from '@/lib/types';
import { fetchWithRetry, HEADERS, parsePrice } from '@/lib/scrapers/utils';

export async function searchAmazon(query: string): Promise<ProductData[]> {
  const url = `https://www.amazon.in/s?k=${encodeURIComponent(query)}&i=electronics`;
  console.log('[amazonSearch] searching:', url);

  try {
    const response = await fetchWithRetry(url, { headers: HEADERS }, 2);
    const html = await response.text();

    if (html.length < 5000 || html.includes('Type the characters you see in this image')) {
      console.warn('[amazonSearch] blocked or CAPTCHA, returning []');
      return [];
    }

    const $ = cheerio.load(html);
    const results: ProductData[] = [];

    $('[data-component-type="s-search-result"][data-asin]').each((_, el) => {
      if (results.length >= 5) return false;

      const asin = $(el).attr('data-asin');
      if (!asin) return;

      const titleEl = $(el).find('h2 a span, h2 span.a-text-normal').first();
      const name = titleEl.text().trim();
      if (!name) return;

      const priceWhole = $(el).find('.a-price .a-offscreen').first().text().trim();
      const imageSrc = $(el).find('img.s-image').attr('src') ?? null;

      const ratingText = $(el).find('.a-icon-star-small .a-icon-alt, .a-icon-star .a-icon-alt').first().text();
      const ratingMatch = ratingText.match(/(\d+(\.\d+)?)/);

      results.push({
        name,
        price: parsePrice(priceWhole),
        mrp: null,
        image: imageSrc,
        modelNumber: null,
        category: null,
        store: 'Amazon',
        url: `https://www.amazon.in/dp/${asin}`,
        rating: ratingMatch ? parseFloat(ratingMatch[1]) : null,
        inStock: true,
      });
    });

    console.log(`[amazonSearch] found ${results.length} results`);
    return results;
  } catch (err) {
    console.warn('[amazonSearch] error:', err);
    return [];
  }
}
