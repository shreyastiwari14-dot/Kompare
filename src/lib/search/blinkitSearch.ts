import { ProductData } from '@/lib/types';
import { fetchWithRetry, JSON_HEADERS, parsePrice } from '@/lib/scrapers/utils';

interface BlinkitSearchProduct {
  name?: string;
  price?: number | string;
  mrp?: number | string;
  image?: string;
  image_url?: string;
  id?: number | string;
  prid?: number | string;
  category?: string;
  in_stock?: boolean | number;
}

interface BlinkitSearchResponse {
  products?: BlinkitSearchProduct[];
  data?: { products?: BlinkitSearchProduct[] };
  response?: { products?: BlinkitSearchProduct[] };
}

export async function searchBlinkit(query: string): Promise<ProductData[]> {
  const url = `https://blinkit.com/v2/search?q=${encodeURIComponent(query)}`;
  console.log('[blinkitSearch] searching:', url);

  try {
    const response = await fetchWithRetry(url, {
      headers: {
        ...JSON_HEADERS,
        Referer: 'https://blinkit.com/',
        Origin: 'https://blinkit.com',
      },
    }, 2);

    const json = await response.json() as BlinkitSearchResponse;

    // Blinkit response shape varies — try multiple paths
    const products: BlinkitSearchProduct[] =
      json?.products ??
      json?.data?.products ??
      json?.response?.products ??
      [];

    const results: ProductData[] = products.slice(0, 5).map(p => {
      const prid = p.prid ?? p.id ?? '';
      const image = p.image_url ?? p.image ?? null;
      return {
        name: p.name ?? 'Unknown',
        price: typeof p.price === 'number' ? p.price : parsePrice(String(p.price ?? '')),
        mrp: typeof p.mrp === 'number' ? p.mrp : parsePrice(String(p.mrp ?? '')),
        image,
        modelNumber: null,
        category: p.category ?? null,
        store: 'Blinkit',
        url: prid ? `https://blinkit.com/prn/${encodeURIComponent(p.name ?? '')}/prid/${prid}` : 'https://blinkit.com',
        rating: null,
        inStock: p.in_stock === true || p.in_stock === 1,
      };
    });

    console.log(`[blinkitSearch] found ${results.length} results`);
    return results;
  } catch (err) {
    console.warn('[blinkitSearch] error:', err);
    return [];
  }
}
