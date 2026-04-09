import { ProductData } from '../types';
import { parseProductLink } from '../linkParser';
import { scrapeAmazon } from './amazon';
import { scrapeFlipkart } from './flipkart';
import { scrapeBlinkit } from './blinkit';
import { scrapeZepto } from './zepto';

export async function scrapeProduct(url: string): Promise<ProductData> {
  const { store, productId } = parseProductLink(url);
  console.log(`[scraper] detected store="${store}", productId="${productId}", url="${url}"`);

  switch (store) {
    case 'amazon':
      return scrapeAmazon(url);
    case 'flipkart':
      return scrapeFlipkart(url);
    case 'blinkit':
      return scrapeBlinkit(url);
    case 'zepto':
      return scrapeZepto(url);
    case 'croma':
    case 'myntra':
    case 'ajio':
      // These stores will get dedicated scrapers in phase 2.
      // For now return a partial stub so the API doesn't error.
      return {
        name: 'Product',
        price: null,
        mrp: null,
        image: null,
        modelNumber: null,
        category: null,
        store: store.charAt(0).toUpperCase() + store.slice(1),
        url,
        rating: null,
        inStock: true,
      };
    default:
      throw new Error(`Unsupported store for URL: ${url}`);
  }
}
