import { StorePrice } from '@/lib/mockData';

// ── Store metadata keyed by normalized store ID ──────────────────────────────
const STORE_META: Record<string, {
  logoInitials: string;
  logoColor: string;
  isQuickCommerce: boolean;
  deliveryInfo: string;
  deliveryTime?: string;
}> = {
  amazon:     { logoInitials: 'AM', logoColor: 'from-orange-400 to-orange-600', isQuickCommerce: false, deliveryInfo: 'Free delivery' },
  flipkart:   { logoInitials: 'FK', logoColor: 'from-blue-400 to-blue-600',    isQuickCommerce: false, deliveryInfo: 'Free delivery' },
  croma:      { logoInitials: 'CR', logoColor: 'from-green-400 to-green-600',   isQuickCommerce: false, deliveryInfo: 'Delivered in 3-4 days' },
  reliance:   { logoInitials: 'RD', logoColor: 'from-red-500 to-red-700',       isQuickCommerce: false, deliveryInfo: 'Free delivery' },
  tatacliq:   { logoInitials: 'TC', logoColor: 'from-purple-400 to-purple-600', isQuickCommerce: false, deliveryInfo: 'Free delivery' },
  vijaysales: { logoInitials: 'VS', logoColor: 'from-blue-600 to-blue-800',     isQuickCommerce: false, deliveryInfo: 'Free delivery' },
  myntra:     { logoInitials: 'MY', logoColor: 'from-pink-400 to-pink-600',     isQuickCommerce: false, deliveryInfo: 'Free delivery' },
  ajio:       { logoInitials: 'AJ', logoColor: 'from-indigo-400 to-indigo-600', isQuickCommerce: false, deliveryInfo: 'Free delivery' },
  nykaa:      { logoInitials: 'NK', logoColor: 'from-rose-400 to-rose-600',     isQuickCommerce: false, deliveryInfo: 'Free delivery' },
  samsung:    { logoInitials: 'SS', logoColor: 'from-blue-700 to-indigo-700',   isQuickCommerce: false, deliveryInfo: 'Free delivery' },
  apple:      { logoInitials: 'AP', logoColor: 'from-gray-500 to-gray-700',     isQuickCommerce: false, deliveryInfo: 'Free delivery' },
};

function normalizeStoreId(source: string): string {
  const s = (source || '').toLowerCase();
  if (s.includes('amazon'))                         return 'amazon';
  if (s.includes('flipkart'))                       return 'flipkart';
  if (s.includes('croma'))                          return 'croma';
  if (s.includes('reliance') || s.includes('jio digital')) return 'reliance';
  if (s.includes('tata') && s.includes('cliq'))     return 'tatacliq';
  if (s.includes('vijay'))                          return 'vijaysales';
  if (s.includes('myntra'))                         return 'myntra';
  if (s.includes('ajio'))                           return 'ajio';
  if (s.includes('nykaa'))                          return 'nykaa';
  if (s.includes('samsung') && s.includes('shop')) return 'samsung';
  if (s.includes('apple') && s.includes('store'))  return 'apple';
  // Generic fallback — create an ID from the source name
  return s.replace(/[^a-z0-9]/g, '').slice(0, 20);
}

function normalizeStoreName(source: string): string {
  const id = normalizeStoreId(source);
  const known: Record<string, string> = {
    amazon: 'Amazon', flipkart: 'Flipkart', croma: 'Croma',
    reliance: 'Reliance Digital', tatacliq: 'Tata CLiQ',
    vijaysales: 'Vijay Sales', myntra: 'Myntra', ajio: 'Ajio',
    nykaa: 'Nykaa', samsung: 'Samsung Shop', apple: 'Apple Store',
  };
  return known[id] || source;
}

export interface ShoppingResult {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  store: string;          // normalized store ID
  storeName: string;      // display name
  url: string;
  image?: string;
  rating?: number;
  reviews?: number;
  delivery?: string | null;
  logoInitials: string;
  logoColor: string;
  isQuickCommerce: boolean;
  deliveryInfo: string;
  deliveryTime?: string;
  position: number;
}

interface SerpApiShoppingItem {
  title?: string;
  price?: string;
  extracted_price?: number;
  old_price?: string;
  extracted_old_price?: number;
  link?: string;
  source?: string;
  thumbnail?: string;
  rating?: number;
  reviews?: number;
  delivery?: string;
  position?: number;
}

export async function searchGoogleShopping(query: string): Promise<ShoppingResult[]> {
  const key = process.env.SERPAPI_KEY || 'm8xTVQYc2c8vhwudBMMKjSNo';

  const params = new URLSearchParams({
    engine:  'google_shopping',
    q:       query,
    location: 'India',
    gl:      'in',
    hl:      'en',
    num:     '20',
    api_key: key,
  });

  console.log('[googleShopping] searching:', query);

  const res = await fetch(`https://serpapi.com/search.json?${params}`, {
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    console.error('[googleShopping] API error:', res.status, await res.text());
    throw new Error(`SerpAPI returned ${res.status}`);
  }

  const data = await res.json() as { shopping_results?: SerpApiShoppingItem[] };
  const items: SerpApiShoppingItem[] = data.shopping_results || [];
  console.log(`[googleShopping] raw results: ${items.length}`);

  return items
    .filter(item => item.extracted_price && item.extracted_price > 0)
    .map((item, i) => {
      const storeId   = normalizeStoreId(item.source ?? '');
      const storeName = normalizeStoreName(item.source ?? '');
      const meta = STORE_META[storeId] ?? {
        logoInitials: (item.source ?? 'ST').slice(0, 2).toUpperCase(),
        logoColor: 'from-gray-400 to-gray-600',
        isQuickCommerce: false,
        deliveryInfo: item.delivery || 'Check store',
      };

      const price = item.extracted_price!;
      const mrp   = item.extracted_old_price;
      const discount = mrp && mrp > price
        ? Math.round(((mrp - price) / mrp) * 100)
        : undefined;

      return {
        id:            `gs-${storeId}-${i}-${Date.now()}`,
        name:          item.title ?? query,
        price,
        originalPrice: mrp,
        discount,
        store:         storeId,
        storeName,
        url:           item.link ?? '',
        image:         item.thumbnail,
        rating:        item.rating,
        reviews:       item.reviews,
        delivery:      item.delivery ?? null,
        position:      item.position ?? i + 1,
        ...meta,
        // Override deliveryInfo if Google Shopping has specific delivery text
        deliveryInfo: item.delivery || meta.deliveryInfo,
      } satisfies ShoppingResult;
    });
}

/** Convert ShoppingResult to StorePrice (UI type) */
export function toStorePrice(r: ShoppingResult): StorePrice & { url: string } {
  return {
    id:            r.id,
    storeName:     r.storeName,
    price:         r.price,
    originalPrice: r.originalPrice,
    discount:      r.discount,
    deliveryInfo:  r.deliveryInfo,
    logoInitials:  r.logoInitials,
    logoColor:     r.logoColor,
    isQuickCommerce: r.isQuickCommerce,
    deliveryTime:  r.deliveryTime,
    url:           r.url,
  };
}
