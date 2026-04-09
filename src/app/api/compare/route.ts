import { NextRequest, NextResponse } from 'next/server';
import { searchGoogleShopping, toStorePrice } from '@/lib/providers/googleShopping';
import { searchQuickCommerce } from '@/lib/providers/quickCommerce';
import { StorePrice } from '@/lib/mockData';

// ── Extract a human-readable search query from a product URL ─────────────────
function extractProductNameFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname;
    const parts = path.split('/').filter(Boolean);

    // Amazon: /Product-Name-Slug/dp/ASIN  →  "Product Name Slug"
    if (url.includes('amazon')) {
      const dpIndex = parts.indexOf('dp');
      if (dpIndex > 0) return parts[dpIndex - 1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }

    // Flipkart: /product-name/p/ITEM_ID  →  "product name"
    if (url.includes('flipkart')) {
      const pIndex = parts.indexOf('p');
      if (pIndex > 0) return parts[pIndex - 1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      if (parts.length > 0) return parts[0].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }

    // Croma: /category/Product-Name/p/12345
    if (url.includes('croma')) {
      const pIndex = parts.indexOf('p');
      if (pIndex > 0) return parts[pIndex - 1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }

    // Generic: use the longest segment that's not a known path token
    const skip = new Set(['dp', 'p', 'buy', 'product', 'item', 'pd', 'sp', 'view', 'detail']);
    const candidate = parts
      .filter(s => !skip.has(s) && s.length > 4 && !/^[A-Z0-9]{6,}$/.test(s))
      .sort((a, b) => b.length - a.length)[0];

    if (candidate) return candidate.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    return u.hostname.replace('www.', '');
  } catch {
    return url;
  }
}

// ── Supabase cache (30-minute TTL) ───────────────────────────────────────────
import { supabase } from '@/lib/supabase';

const CACHE_TTL_MS = 30 * 60 * 1_000;

async function cacheGet(key: string): Promise<unknown | null> {
  try {
    const { data, error } = await supabase
      .from('compare_cache')
      .select('data, created_at')
      .eq('cache_key', key)
      .single();
    if (error || !data) return null;
    const age = Date.now() - new Date(data.created_at as string).getTime();
    if (age > CACHE_TTL_MS) return null;
    return data.data;
  } catch { return null; }
}

async function cacheSet(key: string, value: unknown): Promise<void> {
  try {
    await supabase
      .from('compare_cache')
      .upsert({ cache_key: key, data: value, created_at: new Date().toISOString() });
  } catch { /* non-fatal */ }
}

// ── Dedup: keep cheapest price per store ─────────────────────────────────────
function deduplicateByStore(prices: (StorePrice & { url?: string })[]): (StorePrice & { url?: string })[] {
  const byStore = new Map<string, StorePrice & { url?: string }>();
  for (const p of prices) {
    const key = p.storeName.toLowerCase();
    const existing = byStore.get(key);
    if (!existing || p.price < existing.price) {
      byStore.set(key, p);
    }
  }
  return Array.from(byStore.values());
}

// ── Quick commerce store names ────────────────────────────────────────────────
const QC_STORES = new Set(['Blinkit', 'Zepto', 'Swiggy Instamart', 'BigBasket']);

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { url?: string; query?: string };
    const { url, query } = body;

    // Resolve search query
    let searchQuery = (query ?? '').trim();
    if (!searchQuery && url) {
      searchQuery = extractProductNameFromUrl(url);
    }

    if (!searchQuery) {
      return NextResponse.json(
        { success: false, message: 'Please provide a URL or search query.' },
        { status: 400 }
      );
    }

    console.log(`[compare] Searching: "${searchQuery}"`);

    // Check cache
    const cacheKey = `compare:${searchQuery.toLowerCase()}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      console.log('[compare] cache hit');
      return NextResponse.json({ success: true, cached: true, ...(cached as object) });
    }

    // Run Google Shopping + Quick Commerce in parallel
    const [shoppingResult, qcResult] = await Promise.allSettled([
      searchGoogleShopping(searchQuery),
      searchQuickCommerce(searchQuery),
    ]);

    const storePrices: (StorePrice & { url?: string })[] = [];
    let productName = searchQuery;
    let productImage: string | null = null;

    // Google Shopping results
    if (shoppingResult.status === 'fulfilled') {
      const results = shoppingResult.value;
      console.log(`[compare] Google Shopping: ${results.length} results`);
      if (results.length > 0) {
        productName  = results[0].name;
        productImage = results[0].image ?? null;
      }
      storePrices.push(...results.map(toStorePrice));
    } else {
      console.error('[compare] Google Shopping failed:', shoppingResult.reason);
    }

    // Quick Commerce results
    if (qcResult.status === 'fulfilled') {
      console.log(`[compare] Quick Commerce: ${qcResult.value.length} results`);
      storePrices.push(...qcResult.value);
    } else {
      console.warn('[compare] Quick Commerce failed:', qcResult.reason);
    }

    // Deduplicate and sort
    const allPrices = deduplicateByStore(storePrices)
      .filter(p => p.price > 0)
      .sort((a, b) => a.price - b.price);

    const ecommerce    = allPrices.filter(p => !QC_STORES.has(p.storeName));
    const quickCommerce = allPrices.filter(p => QC_STORES.has(p.storeName));
    const bestPrice    = allPrices[0] ?? null;

    console.log(`[compare] Final: ${ecommerce.length} e-commerce, ${quickCommerce.length} quick commerce`);

    const payload = {
      success:      true,
      query:        searchQuery,
      product: {
        name:  productName,
        image: productImage,
      },
      prices:       allPrices,
      ecommerce,
      quickCommerce,
      bestPrice,
      totalStores:  allPrices.length,
      cached:       false,
      timestamp:    new Date().toISOString(),
    };

    await cacheSet(cacheKey, payload);
    return NextResponse.json(payload);

  } catch (error) {
    console.error('[compare] error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
