import { NextRequest, NextResponse } from 'next/server';
import { scrapeProduct } from '@/lib/scrapers';
import { parseProductLink } from '@/lib/linkParser';
import { searchAllStores } from '@/lib/search';
import { scoreAll } from '@/lib/productMatcher';
import { supabase } from '@/lib/supabase';
import { ProductData } from '@/lib/types';
import { StorePrice } from '@/lib/mockData';

// ── Store display metadata ──────────────────────────────────────────────────
const STORE_META: Record<string, {
  logoInitials: string;
  logoColor: string;
  isQuickCommerce: boolean;
  deliveryInfo: string;
  deliveryTime?: string;
}> = {
  Amazon:   { logoInitials: 'AM', logoColor: 'from-orange-400 to-orange-600', isQuickCommerce: false, deliveryInfo: 'Free delivery in 2-3 days' },
  Flipkart: { logoInitials: 'FK', logoColor: 'from-blue-400 to-blue-600',    isQuickCommerce: false, deliveryInfo: 'Free delivery by tomorrow' },
  Croma:    { logoInitials: 'CR', logoColor: 'from-green-400 to-green-600',   isQuickCommerce: false, deliveryInfo: 'Free delivery in 3-4 days' },
  Blinkit:  { logoInitials: 'BK', logoColor: 'from-yellow-300 to-yellow-500', isQuickCommerce: true,  deliveryInfo: 'Delivered in 10 min', deliveryTime: '10 min' },
  Zepto:    { logoInitials: 'ZP', logoColor: 'from-cyan-400 to-cyan-600',     isQuickCommerce: true,  deliveryInfo: 'Delivered in 12 min', deliveryTime: '12 min' },
};

function productToStorePrice(p: ProductData): StorePrice | null {
  if (!p.price || p.price <= 0) return null;
  const meta = STORE_META[p.store] ?? {
    logoInitials: p.store.slice(0, 2).toUpperCase(),
    logoColor: 'from-gray-400 to-gray-600',
    isQuickCommerce: false,
    deliveryInfo: 'Check store for delivery',
  };
  const discount = p.mrp && p.mrp > p.price
    ? Math.round(((p.mrp - p.price) / p.mrp) * 100)
    : undefined;

  return {
    id: `${p.store.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    storeName: p.store,
    price: p.price,
    originalPrice: p.mrp ?? undefined,
    discount,
    deliveryInfo: meta.deliveryInfo,
    logoInitials: meta.logoInitials,
    logoColor: meta.logoColor,
    isQuickCommerce: meta.isQuickCommerce,
    deliveryTime: meta.deliveryTime,
  };
}

/** Try to extract a clean product name from the URL path when scraping fails */
function nameFromUrl(url: string, store: string): string | null {
  try {
    const { pathname } = new URL(url);
    if (store === 'amazon') {
      const m = pathname.match(/^\/([^/]+)\/dp\//);
      if (m) return m[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
    if (store === 'flipkart') {
      const m = pathname.match(/^\/([^/]+)\/p\//);
      if (m) return m[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
    if (store === 'croma') {
      const m = pathname.match(/^\/([^/]+)\/p\//);
      if (m) return m[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
  } catch { /* ignore */ }
  return null;
}

// ── Supabase cache helpers ──────────────────────────────────────────────────
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

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
  } catch { /* cache failure is non-fatal */ }
}

// ── Legacy mock data ────────────────────────────────────────────────────────
import { getProductBySearchQuery } from '@/lib/mockData';

// ── Route handler ───────────────────────────────────────────────────────────
interface CompareResponse {
  success: boolean;
  source?: ProductData;
  prices?: StorePrice[];
  cached?: boolean;
  query?: string;
  // legacy fields
  product?: unknown;
  bestPrice?: unknown;
  history?: unknown;
  message?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<CompareResponse>> {
  try {
    const body = await request.json() as { url?: string; query?: string };
    const { url, query } = body;

    // ── URL mode: full scrape + cross-store search ──────────────────────────
    if (url && typeof url === 'string') {
      console.log('[compare] URL mode:', url);

      const { store, productId } = parseProductLink(url);
      if (store === 'unknown') {
        return NextResponse.json(
          { success: false, message: `Could not detect store from URL: ${url}` },
          { status: 400 }
        );
      }

      // Check cache first
      const cacheKey = `compare:${url}`;
      const cached = await cacheGet(cacheKey);
      if (cached) {
        console.log('[compare] cache hit for:', url);
        return NextResponse.json({ success: true, cached: true, ...(cached as object) });
      }

      // 1. Scrape source product
      let source: ProductData;
      try {
        source = await scrapeProduct(url);
      } catch (err) {
        console.warn('[compare] scrape failed:', err);
        // Build a minimal stub from URL path so we can still search
        const urlName = nameFromUrl(url, store);
        source = {
          name: urlName ?? 'Unknown Product',
          price: null, mrp: null, image: null, modelNumber: null,
          category: null, store: store.charAt(0).toUpperCase() + store.slice(1),
          url, rating: null, inStock: true,
        };
      }

      // If name is still generic, try URL path
      if (source.name === 'Unknown Product' || !source.name) {
        const urlName = nameFromUrl(url, store);
        if (urlName) source = { ...source, name: urlName };
      }

      console.log('[compare] source product:', source.name, '| store:', source.store);

      // 2. Search all OTHER stores in parallel (exclude source store)
      type StoreKeyType = 'amazon' | 'flipkart' | 'blinkit' | 'zepto' | 'croma';
      const validStoreKeys: StoreKeyType[] = ['amazon', 'flipkart', 'blinkit', 'zepto', 'croma'];
      const excludeList: StoreKeyType[] = validStoreKeys.includes(store as StoreKeyType)
        ? [store as StoreKeyType]
        : [];
      const candidates = await searchAllStores(
        source.name,
        source.modelNumber,
        excludeList
      );

      // 3. Score and filter candidates
      const scored = scoreAll(source, candidates);
      const CONFIDENCE_THRESHOLD = 0.55; // lower threshold since names from blocked scrapes may be generic
      const matched = scored
        .filter(m => m.confidence >= CONFIDENCE_THRESHOLD)
        .map(m => m.product);

      console.log(`[compare] matched ${matched.length} candidates above threshold`);

      // 4. Build StorePrice[] — source store first, then matched
      const prices: StorePrice[] = [];

      // Source store price (if we got a real price)
      const sourcePrice = productToStorePrice(source);
      if (sourcePrice) prices.push(sourcePrice);

      // Deduplicate by store name — keep best price per store
      const seenStores = new Set<string>(sourcePrice ? [source.store] : []);
      for (const p of matched) {
        if (!seenStores.has(p.store)) {
          const sp = productToStorePrice(p);
          if (sp) { prices.push(sp); seenStores.add(p.store); }
        }
      }

      // Sort by price ascending
      prices.sort((a, b) => a.price - b.price);

      const result = { source, prices, query: source.name, productId };
      await cacheSet(cacheKey, result);

      return NextResponse.json({ success: true, cached: false, ...result });
    }

    // ── Query mode: legacy mock data ────────────────────────────────────────
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Provide either "url" or "query".' },
        { status: 400 }
      );
    }

    const mockData = getProductBySearchQuery(query);
    if (!mockData) {
      return NextResponse.json(
        { success: false, message: `No products found matching "${query}".` },
        { status: 404 }
      );
    }

    const bestPrice = mockData.storePrices.reduce((best, cur) =>
      cur.price < best.price ? cur : best
    );

    return NextResponse.json({
      success: true,
      product: mockData,
      prices: mockData.storePrices,
      bestPrice,
      history: mockData.priceHistory,
    });
  } catch (error) {
    console.error('[compare] error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
