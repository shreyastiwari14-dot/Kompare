import { ProductData } from '../types';
import { parseProductLink } from '../linkParser';
import { scrapeAmazon } from './amazon';
import { scrapeFlipkart } from './flipkart';
import { scrapeBlinkit } from './blinkit';
import { scrapeZepto } from './zepto';
import { scrapeCroma } from './croma';
import { scrapeReliance } from './reliance';
import { scrapeMyntra } from './myntra';
import { scrapeAjio } from './ajio';

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
      return scrapeCroma(url);
    case 'reliance':
      return scrapeReliance(url);
    case 'myntra':
      return scrapeMyntra(url);
    case 'ajio':
      return scrapeAjio(url);
    default:
      throw new Error(`Unsupported store for URL: ${url}`);
  }
}
