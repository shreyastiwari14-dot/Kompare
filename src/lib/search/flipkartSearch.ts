import * as cheerio from 'cheerio';
import { ProductData } from '@/lib/types';
import { fetchWithRetry, HEADERS, parsePrice } from '@/lib/scrapers/utils';

export async function searchFlipkart(query: string): Promise<ProductData[]> {
  const url = `https://www.flipkart.com/search?q=${encodeURIComponent(query)}&otracker=search`;
  console.log('[flipkartSearch] searching:', url);

  try {
    const response = await fetchWithRetry(url, { headers: HEADERS }, 2);
    const html = await response.text();

    if (html.length < 5000 || response.status === 403) {
      console.warn('[flipkartSearch] blocked, returning []');
      return [];
    }

    const $ = cheerio.load(html);
    const results: ProductData[] = [];

    // Flipkart search results use various class names — try multiple containers
    const selectors = ['._1AtVbE', '._13oc-S', '.CGtC98', '._2kHMtA'];
    let container = $();
    for (const sel of selectors) {
      const found = $(sel);
      if (found.length > 2) { container = found; break; }
    }

    container.each((_, el) => {
      if (results.length >= 5) return false;

      // Title: try known class names then fall back to <a> text
      const name =
        $(el).find('._4rR01T, .s1Q9rs, .IRpwTa, .WKTcLC').first().text().trim() ||
        $(el).find('a[title]').first().attr('title')?.trim() || '';
      if (!name) return;

      const rawPrice = $(el).find('._30jeq3, .Nx9bqj').first().text().trim();
      const image = $(el).find('img._396cs4, img.DByuf4').first().attr('src') ?? null;
      const href = $(el).find('a._1fQZEK, a.s1Q9rs, a._2rpwqI').first().attr('href') ?? '';
      const productUrl = href ? `https://www.flipkart.com${href.split('?')[0]}` : '';

      const ratingText = $(el).find('._3LWZlK').first().text().trim();
      const rating = ratingText ? parseFloat(ratingText) : null;

      results.push({
        name,
        price: parsePrice(rawPrice),
        mrp: null,
        image,
        modelNumber: null,
        category: null,
        store: 'Flipkart',
        url: productUrl,
        rating: isNaN(rating!) ? null : rating,
        inStock: true,
      });
    });

    console.log(`[flipkartSearch] found ${results.length} results`);
    return results;
  } catch (err) {
    console.warn('[flipkartSearch] error:', err);
    return [];
  }
}
