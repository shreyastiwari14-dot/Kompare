import { ProductData } from '@/lib/types';
import { fetchWithRetry, JSON_HEADERS, parsePrice } from '@/lib/scrapers/utils';

interface ZeptoProduct {
  name?: string;
  displayName?: string;
  sellingPrice?: number;
  mrp?: number;
  imageUrl?: string;
  image?: string;
  productId?: string;
  id?: string;
  categoryName?: string;
  inStock?: boolean;
}

interface ZeptoSearchResponse {
  data?: {
    products?: ZeptoProduct[];
    sections?: Array<{ products?: ZeptoProduct[] }>;
  };
  products?: ZeptoProduct[];
}

export async function searchZepto(query: string): Promise<ProductData[]> {
  // Zepto's search goes through a GraphQL endpoint
  const gqlUrl = 'https://api.zeptonow.com/api/v1/graphql';
  console.log('[zeptoSearch] searching via GraphQL:', query);

  try {
    const gqlQuery = `
      query SearchProducts($query: String!) {
        searchProducts(query: $query, limit: 5) {
          name
          displayName
          sellingPrice
          mrp
          imageUrl
          productId
          categoryName
          inStock
        }
      }
    `;

    const response = await fetchWithRetry(gqlUrl, {
      method: 'POST',
      headers: { ...JSON_HEADERS, Referer: 'https://zeptonow.com/' },
      body: JSON.stringify({ query: gqlQuery, variables: { query } }),
    }, 2);

    const json = await response.json() as { data?: { searchProducts?: ZeptoProduct[] } };
    const products = json?.data?.searchProducts ?? [];

    if (products.length > 0) {
      const results = products.slice(0, 5).map(p => ({
        name: p.displayName ?? p.name ?? 'Unknown',
        price: p.sellingPrice ?? null,
        mrp: p.mrp ?? null,
        image: p.imageUrl ?? null,
        modelNumber: null,
        category: p.categoryName ?? null,
        store: 'Zepto',
        url: p.productId ? `https://zeptonow.com/product/${p.productId}` : 'https://zeptonow.com',
        rating: null,
        inStock: p.inStock ?? true,
      }));
      console.log(`[zeptoSearch] found ${results.length} results via GraphQL`);
      return results;
    }
  } catch (err) {
    console.warn('[zeptoSearch] GraphQL failed:', err);
  }

  // REST fallback
  try {
    const restUrl = `https://api.zeptonow.com/api/v3/search/?query=${encodeURIComponent(query)}&page_number=0&page_size=5`;
    const response = await fetchWithRetry(restUrl, {
      headers: { ...JSON_HEADERS, Referer: 'https://zeptonow.com/' },
    }, 2);

    const json = await response.json() as ZeptoSearchResponse;
    const products: ZeptoProduct[] =
      json?.data?.products ??
      json?.products ??
      json?.data?.sections?.[0]?.products ??
      [];

    const results = products.slice(0, 5).map(p => ({
      name: p.displayName ?? p.name ?? 'Unknown',
      price: p.sellingPrice ?? parsePrice(String(p.sellingPrice ?? '')) ?? null,
      mrp: p.mrp ?? null,
      image: p.imageUrl ?? p.image ?? null,
      modelNumber: null,
      category: p.categoryName ?? null,
      store: 'Zepto',
      url: (p.productId ?? p.id) ? `https://zeptonow.com/product/${p.productId ?? p.id}` : 'https://zeptonow.com',
      rating: null,
      inStock: p.inStock ?? true,
    }));

    console.log(`[zeptoSearch] found ${results.length} results via REST`);
    return results;
  } catch (err) {
    console.warn('[zeptoSearch] REST fallback failed:', err);
    return [];
  }
}
