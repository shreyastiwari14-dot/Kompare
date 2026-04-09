import { ProductData } from '../types';
import { fetchWithRetry, JSON_HEADERS, HEADERS, parsePrice } from './utils';
import { parseProductLink } from '../linkParser';

interface BlinkitProduct {
  name?: string;
  price?: number | string;
  mrp?: number | string;
  image?: string;
  images?: string[];
  category?: string;
  in_stock?: boolean | number;
  available?: boolean;
}

export async function scrapeBlinkit(url: string): Promise<ProductData> {
  console.log('[blinkit] scraping:', url);

  const { productId } = parseProductLink(url);

  // Blinkit's internal REST API — try the product endpoint
  if (productId) {
    try {
      const apiUrl = `https://blinkit.com/v2/product/${productId}`;
      console.log('[blinkit] trying API:', apiUrl);
      const response = await fetchWithRetry(apiUrl, {
        headers: { ...JSON_HEADERS, Referer: 'https://blinkit.com/' },
      });
      const data = await response.json() as BlinkitProduct;

      if (data?.name) {
        const image = data.images?.[0] ?? data.image ?? null;
        return {
          name: data.name,
          price: typeof data.price === 'number' ? data.price : parsePrice(String(data.price)),
          mrp: typeof data.mrp === 'number' ? data.mrp : parsePrice(String(data.mrp)),
          image: image ?? null,
          modelNumber: null,
          category: data.category ?? null,
          store: 'Blinkit',
          url,
          rating: null,
          inStock: data.in_stock === true || data.in_stock === 1 || data.available === true,
        };
      }
    } catch (err) {
      console.warn('[blinkit] API failed, falling back to HTML:', err);
    }
  }

  // HTML fallback
  const response = await fetchWithRetry(url, { headers: HEADERS });
  const html = await response.text();

  // Blinkit renders via React — try extracting from __NEXT_DATA__ or window.__state__
  let name: string | null = null;
  let price: number | null = null;
  let mrp: number | null = null;
  let image: string | null = null;
  let category: string | null = null;
  let inStock = true;

  const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (nextDataMatch) {
    try {
      const nextData = JSON.parse(nextDataMatch[1]);
      // Traverse the props tree looking for product data
      const str = JSON.stringify(nextData);
      const nameMatch = str.match(/"(?:name|product_name)"\s*:\s*"([^"]+)"/);
      const priceMatch = str.match(/"(?:price|selling_price)"\s*:\s*(\d+)/);
      const mrpMatch = str.match(/"(?:mrp|market_price|original_price)"\s*:\s*(\d+)/);
      const imgMatch = str.match(/"(?:image|image_url|thumbnail)"\s*:\s*"(https?:[^"]+)"/);
      const catMatch = str.match(/"(?:category|category_name)"\s*:\s*"([^"]+)"/);

      name = nameMatch?.[1] ?? null;
      price = priceMatch ? parseInt(priceMatch[1], 10) : null;
      mrp = mrpMatch ? parseInt(mrpMatch[1], 10) : null;
      image = imgMatch?.[1] ?? null;
      category = catMatch?.[1] ?? null;
      inStock = !str.toLowerCase().includes('"in_stock":false') && !str.toLowerCase().includes('"available":false');
    } catch { /* ignore */ }
  }

  // og: tags as last resort
  if (!name) {
    const ogTitle = html.match(/property="og:title"\s+content="([^"]+)"/);
    name = ogTitle?.[1] ?? null;
  }
  if (!image) {
    const ogImg = html.match(/property="og:image"\s+content="([^"]+)"/);
    image = ogImg?.[1] ?? null;
  }

  console.log('[blinkit] extracted:', { name, price, mrp, inStock });

  return {
    name: name ?? 'Unknown Product',
    price,
    mrp,
    image,
    modelNumber: null,
    category,
    store: 'Blinkit',
    url,
    rating: null,
    inStock,
  };
}
