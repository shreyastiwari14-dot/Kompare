import { StorePrice } from '@/lib/mockData';

// Default Mumbai coords — works for most Indian users
const DEFAULT_LAT = 19.076;
const DEFAULT_LNG = 72.8777;

// ── Blinkit ──────────────────────────────────────────────────────────────────
interface BlinkitProduct {
  name?: string;
  price?: number | string;
  offer_price?: number | string;
  mrp?: number | string;
  image_url?: string;
  slug?: string;
  product_id?: number | string;
  in_stock?: boolean | number;
}

async function searchBlinkit(query: string, lat = DEFAULT_LAT, lng = DEFAULT_LNG): Promise<(StorePrice & { url: string })[]> {
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

    const data = await res.json() as { products?: BlinkitProduct[] };
    const products = data.products || [];
    console.log(`[blinkit] found ${products.length} results`);

    return products.slice(0, 3).map((p, i) => {
      const price = typeof p.offer_price === 'number' ? p.offer_price :
                    typeof p.price === 'number' ? p.price : 0;
      const mrp   = typeof p.mrp === 'number' ? p.mrp : price;
      const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : undefined;

      return {
        id:            `blinkit-${i}-${Date.now()}`,
        storeName:     'Blinkit',
        price,
        originalPrice: mrp > price ? mrp : undefined,
        discount,
        deliveryInfo:  'Delivered in 10 min',
        logoInitials:  'BK',
        logoColor:     'from-yellow-300 to-yellow-500',
        isQuickCommerce: true,
        deliveryTime:  '10 min',
        url:           p.slug && p.product_id
          ? `https://blinkit.com/prn/${p.slug}/prid/${p.product_id}`
          : `https://blinkit.com/s/?q=${encodeURIComponent(query)}`,
      };
    }).filter(p => p.price > 0);
  } catch (e) {
    console.warn('[blinkit] failed:', e);
    return [];
  }
}

// ── Zepto ─────────────────────────────────────────────────────────────────────
interface ZeptoProduct {
  name?: string;
  product_name?: string;
  selling_price?: number;
  price?: number;
  offer_price?: number;
  mrp?: number;
  max_retail_price?: number;
  image?: string;
  image_url?: string;
  id?: string | number;
  product_id?: string | number;
  in_stock?: boolean;
}

async function searchZepto(query: string, lat = DEFAULT_LAT, lng = DEFAULT_LNG): Promise<(StorePrice & { url: string })[]> {
  try {
    const res = await fetch(
      `https://api.zeptonow.com/api/v3/search?query=${encodeURIComponent(query)}&page_size=5`,
      {
        headers: {
          'x-without-bearer': 'true',
          'platform': 'web',
          'latitude': String(lat),
          'longitude': String(lng),
          'User-Agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36',
        },
        signal: AbortSignal.timeout(10_000),
      }
    );

    const data = await res.json() as { items?: ZeptoProduct[]; results?: ZeptoProduct[] };
    const items: ZeptoProduct[] = data.items || data.results || [];
    console.log(`[zepto] found ${items.length} results`);

    return items.slice(0, 3).map((p, i) => {
      const price = p.selling_price ?? p.offer_price ?? p.price ?? 0;
      const mrp   = p.mrp ?? p.max_retail_price ?? price;
      const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : undefined;
      const pid = p.id ?? p.product_id ?? '';

      return {
        id:            `zepto-${i}-${Date.now()}`,
        storeName:     'Zepto',
        price,
        originalPrice: mrp > price ? mrp : undefined,
        discount,
        deliveryInfo:  'Delivered in 10 min',
        logoInitials:  'ZP',
        logoColor:     'from-cyan-400 to-cyan-600',
        isQuickCommerce: true,
        deliveryTime:  '10 min',
        url:           pid
          ? `https://www.zeptonow.com/product/${pid}`
          : `https://www.zeptonow.com/search?query=${encodeURIComponent(query)}`,
      };
    }).filter(p => p.price > 0);
  } catch (e) {
    console.warn('[zepto] failed:', e);
    return [];
  }
}

// ── BigBasket ─────────────────────────────────────────────────────────────────
interface BBProduct {
  desc?: string;
  product_name?: string;
  id?: string | number;
  p_img_url?: string;
  image_url?: string;
  pricing?: {
    discount?: { prim_price?: { sp?: number } };
    mrp?: { prim_price?: { sp?: number } };
  };
}

async function searchBigBasket(query: string): Promise<(StorePrice & { url: string })[]> {
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

    const data = await res.json() as { tabs?: Array<{ product_info?: { products?: BBProduct[] } }> };
    const products = data.tabs?.[0]?.product_info?.products || [];
    console.log(`[bigbasket] found ${products.length} results`);

    return products.slice(0, 3).map((p, i) => {
      const price = p.pricing?.discount?.prim_price?.sp ?? 0;
      const mrp   = p.pricing?.mrp?.prim_price?.sp ?? price;
      const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : undefined;

      return {
        id:            `bigbasket-${i}-${Date.now()}`,
        storeName:     'BigBasket',
        price,
        originalPrice: mrp > price ? mrp : undefined,
        discount,
        deliveryInfo:  'Delivered today or tomorrow',
        logoInitials:  'BB',
        logoColor:     'from-green-500 to-green-700',
        isQuickCommerce: true,
        url:           p.id
          ? `https://www.bigbasket.com/pd/${p.id}/`
          : `https://www.bigbasket.com/ps/?q=${encodeURIComponent(query)}`,
      };
    }).filter(p => p.price > 0);
  } catch (e) {
    console.warn('[bigbasket] failed:', e);
    return [];
  }
}

// ── Swiggy Instamart ──────────────────────────────────────────────────────────
interface InstamartItem {
  display_name?: string;
  name?: string;
  offer_price?: number;
  price?: number;
  mrp?: number;
  max_price?: number;
  image_url?: string;
  item_id?: string | number;
}

async function searchInstamart(query: string, lat = DEFAULT_LAT, lng = DEFAULT_LNG): Promise<(StorePrice & { url: string })[]> {
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

    const data = await res.json() as { data?: { widgets?: Array<{ data?: InstamartItem[] }> } };
    const widgets = data.data?.widgets || [];
    const items: InstamartItem[] = widgets.flatMap(w => w.data || []);
    console.log(`[instamart] found ${items.length} results`);

    return items.slice(0, 3).map((p, i) => {
      const price = p.offer_price ?? p.price ?? 0;
      const mrp   = p.mrp ?? p.max_price ?? price;
      const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : undefined;

      return {
        id:            `instamart-${i}-${Date.now()}`,
        storeName:     'Swiggy Instamart',
        price,
        originalPrice: mrp > price ? mrp : undefined,
        discount,
        deliveryInfo:  'Delivered in 15 min',
        logoInitials:  'IM',
        logoColor:     'from-orange-500 to-red-500',
        isQuickCommerce: true,
        deliveryTime:  '15 min',
        url:           p.item_id
          ? `https://www.swiggy.com/instamart/item/${p.item_id}`
          : `https://www.swiggy.com/instamart`,
      };
    }).filter(p => p.price > 0);
  } catch (e) {
    console.warn('[instamart] failed:', e);
    return [];
  }
}

// ── Public export ─────────────────────────────────────────────────────────────
export async function searchQuickCommerce(
  query: string,
  lat?: number,
  lng?: number
): Promise<(StorePrice & { url: string })[]> {
  const settled = await Promise.allSettled([
    searchBlinkit(query, lat, lng),
    searchZepto(query, lat, lng),
    searchBigBasket(query),
    searchInstamart(query, lat, lng),
  ]);

  const results: (StorePrice & { url: string })[] = [];
  const labels = ['Blinkit', 'Zepto', 'BigBasket', 'Instamart'];

  settled.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      results.push(...r.value);
    } else {
      console.warn(`[quickCommerce] ${labels[i]} failed:`, r.reason?.message ?? r.reason);
    }
  });

  console.log(`[quickCommerce] total: ${results.length}`);
  return results;
}
