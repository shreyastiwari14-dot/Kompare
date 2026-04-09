import type { ShoppingResult } from './googleShopping';

const DEFAULT_LAT = 19.076;
const DEFAULT_LNG = 72.8777;

async function searchBlinkit(query: string, lat = DEFAULT_LAT, lng = DEFAULT_LNG): Promise<ShoppingResult[]> {
  try {
    const res = await fetch('https://blinkit.com/v2/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'app_client': 'consumer_web',
        'web_app_version': '1014005',
        'lat': String(lat),
        'lon': String(lng),
      },
      body: JSON.stringify({ q: query }),
      signal: AbortSignal.timeout(10_000),
    });
    const data = await res.json() as { products?: any[] };
    const products = data.products || [];
    console.log(`[blinkit] found ${products.length} results`);

    return products.slice(0, 3).map((p: any, i: number) => {
      const price = typeof p.offer_price === 'number' ? p.offer_price :
                    typeof p.price === 'number' ? p.price : 0;
      return {
        name: p.name || query,
        price,
        store: 'blinkit',
        storeName: 'Blinkit',
        url: p.slug && p.product_id
          ? `https://blinkit.com/prn/${p.slug}/prid/${p.product_id}`
          : `https://blinkit.com/s/?q=${encodeURIComponent(query)}`,
        image: p.image_url || null,
        rating: null,
        reviews: null,
        delivery: '10 min delivery',
      };
    }).filter((p: ShoppingResult) => p.price > 0);
  } catch (e) {
    console.warn('[blinkit] failed:', e);
    return [];
  }
}

async function searchZepto(query: string, lat = DEFAULT_LAT, lng = DEFAULT_LNG): Promise<ShoppingResult[]> {
  try {
    const res = await fetch(
      `https://api.zeptonow.com/api/v3/search?query=${encodeURIComponent(query)}&page_size=5`,
      {
        headers: {
          'x-without-bearer': 'true',
          'platform': 'web',
          'latitude': String(lat),
          'longitude': String(lng),
        },
        signal: AbortSignal.timeout(10_000),
      }
    );
    const data = await res.json() as { items?: any[]; results?: any[] };
    const items = data.items || data.results || [];
    console.log(`[zepto] found ${items.length} results`);

    return items.slice(0, 3).map((p: any, i: number) => {
      const price = p.selling_price ?? p.offer_price ?? p.price ?? 0;
      const pid = p.id ?? p.product_id ?? '';
      return {
        name: p.name || p.product_name || query,
        price,
        store: 'zepto',
        storeName: 'Zepto',
        url: pid
          ? `https://www.zeptonow.com/product/${pid}`
          : `https://www.zeptonow.com/search?query=${encodeURIComponent(query)}`,
        image: p.image || p.image_url || null,
        rating: null,
        reviews: null,
        delivery: '10 min delivery',
      };
    }).filter((p: ShoppingResult) => p.price > 0);
  } catch (e) {
    console.warn('[zepto] failed:', e);
    return [];
  }
}

async function searchBigBasket(query: string): Promise<ShoppingResult[]> {
  try {
    const res = await fetch(
      `https://www.bigbasket.com/listing-svc/v2/products?type=search&slug=${encodeURIComponent(query)}&page=1`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36',
          'x-channel': 'BB-WEB',
        },
        signal: AbortSignal.timeout(10_000),
      }
    );
    const data = await res.json() as { tabs?: Array<{ product_info?: { products?: any[] } }> };
    const products = data.tabs?.[0]?.product_info?.products || [];
    console.log(`[bigbasket] found ${products.length} results`);

    return products.slice(0, 3).map((p: any, i: number) => {
      const price = p.pricing?.discount?.prim_price?.sp ?? 0;
      return {
        name: p.desc || p.product_name || query,
        price,
        store: 'bigbasket',
        storeName: 'BigBasket',
        url: p.id
          ? `https://www.bigbasket.com/pd/${p.id}/`
          : `https://www.bigbasket.com/ps/?q=${encodeURIComponent(query)}`,
        image: p.p_img_url || p.image_url || null,
        rating: null,
        reviews: null,
        delivery: 'Same day delivery',
      };
    }).filter((p: ShoppingResult) => p.price > 0);
  } catch (e) {
    console.warn('[bigbasket] failed:', e);
    return [];
  }
}

async function searchInstamart(query: string, lat = DEFAULT_LAT, lng = DEFAULT_LNG): Promise<ShoppingResult[]> {
  try {
    const res = await fetch(
      `https://www.swiggy.com/api/instamart/search?pageNumber=0&searchResultsOffset=0&limit=5&query=${encodeURIComponent(query)}&ageConsent=false`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36',
          'lat': String(lat),
          'lng': String(lng),
        },
        signal: AbortSignal.timeout(10_000),
      }
    );
    const data = await res.json() as { data?: { widgets?: Array<{ data?: any[] }> } };
    const widgets = data.data?.widgets || [];
    const items: any[] = widgets.flatMap(w => w.data || []);
    console.log(`[instamart] found ${items.length} results`);

    return items.slice(0, 3).map((p: any, i: number) => {
      const price = p.offer_price ?? p.price ?? 0;
      return {
        name: p.display_name || p.name || query,
        price,
        store: 'instamart',
        storeName: 'Swiggy Instamart',
        url: p.item_id
          ? `https://www.swiggy.com/instamart/item/${p.item_id}`
          : `https://www.swiggy.com/instamart`,
        image: p.image_url || null,
        rating: null,
        reviews: null,
        delivery: '15 min delivery',
      };
    }).filter((p: ShoppingResult) => p.price > 0);
  } catch (e) {
    console.warn('[instamart] failed:', e);
    return [];
  }
}

export async function searchQuickCommerce(
  query: string,
  lat?: number,
  lng?: number
): Promise<ShoppingResult[]> {
  const settled = await Promise.allSettled([
    searchBlinkit(query, lat, lng),
    searchZepto(query, lat, lng),
    searchBigBasket(query),
    searchInstamart(query, lat, lng),
  ]);

  const results: ShoppingResult[] = [];
  settled.forEach((r, i) => {
    if (r.status === 'fulfilled') results.push(...r.value);
  });
  console.log(`[quickCommerce] total: ${results.length}`);
  return results;
}
