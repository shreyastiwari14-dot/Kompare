import { ProductData } from '../types';
import { fetchWithRetry, JSON_HEADERS, HEADERS, parsePrice } from './utils';
import { parseProductLink } from '../linkParser';

export async function scrapeZepto(url: string): Promise<ProductData> {
  console.log('[zepto] scraping:', url);

  const { productId } = parseProductLink(url);

  // Zepto uses a GraphQL API internally
  if (productId) {
    try {
      const gqlUrl = 'https://api.zeptonow.com/api/v1/graphql';
      const query = `
        query GetProduct($id: String!) {
          product(id: $id) {
            name
            sellingPrice
            mrp
            imageUrl
            category { name }
            inStock
          }
        }
      `;
      console.log('[zepto] trying GraphQL for productId:', productId);
      const response = await fetchWithRetry(gqlUrl, {
        method: 'POST',
        headers: { ...JSON_HEADERS, Referer: 'https://zeptonow.com/' },
        body: JSON.stringify({ query, variables: { id: productId } }),
      });
      const json = await response.json() as {
        data?: {
          product?: {
            name?: string;
            sellingPrice?: number;
            mrp?: number;
            imageUrl?: string;
            category?: { name?: string };
            inStock?: boolean;
          };
        };
      };
      const p = json?.data?.product;
      if (p?.name) {
        return {
          name: p.name,
          price: p.sellingPrice ?? null,
          mrp: p.mrp ?? null,
          image: p.imageUrl ?? null,
          modelNumber: null,
          category: p.category?.name ?? null,
          store: 'Zepto',
          url,
          rating: null,
          inStock: p.inStock ?? true,
        };
      }
    } catch (err) {
      console.warn('[zepto] GraphQL failed, falling back to HTML:', err);
    }
  }

  // HTML fallback — Zepto is a SPA, try __NEXT_DATA__ / window state
  const response = await fetchWithRetry(url, { headers: HEADERS });
  const html = await response.text();

  let name: string | null = null;
  let price: number | null = null;
  let mrp: number | null = null;
  let image: string | null = null;
  let category: string | null = null;
  let inStock = true;

  const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (nextDataMatch) {
    try {
      const str = JSON.stringify(JSON.parse(nextDataMatch[1]));
      const nameMatch = str.match(/"(?:name|product_name|title)"\s*:\s*"([^"]{3,})"/);
      const priceMatch = str.match(/"(?:sellingPrice|selling_price|price)"\s*:\s*(\d+)/);
      const mrpMatch = str.match(/"(?:mrp|originalPrice|original_price)"\s*:\s*(\d+)/);
      const imgMatch = str.match(/"(?:imageUrl|image_url|image|thumbnail)"\s*:\s*"(https?:[^"]+)"/);
      const catMatch = str.match(/"(?:category|categoryName|category_name)"\s*:\s*"([^"]+)"/);

      name = nameMatch?.[1] ?? null;
      price = priceMatch ? parseInt(priceMatch[1], 10) : null;
      mrp = mrpMatch ? parseInt(mrpMatch[1], 10) : null;
      image = imgMatch?.[1] ?? null;
      category = catMatch?.[1] ?? null;
      inStock = !str.includes('"inStock":false') && !str.includes('"in_stock":false');
    } catch { /* ignore */ }
  }

  if (!name) {
    const ogTitle = html.match(/property="og:title"\s+content="([^"]+)"/);
    name = ogTitle?.[1] ?? null;
  }
  if (!image) {
    const ogImg = html.match(/property="og:image"\s+content="([^"]+)"/);
    image = ogImg?.[1] ?? null;
  }

  console.log('[zepto] extracted:', { name, price, mrp, inStock });

  return {
    name: name ?? 'Unknown Product',
    price: price ?? parsePrice(html.match(/"price"\s*:\s*"([^"]+)"/)?.[1]),
    mrp,
    image,
    modelNumber: null,
    category,
    store: 'Zepto',
    url,
    rating: null,
    inStock,
  };
}
