import { NextResponse } from 'next/server';
import { extractSearchQuery } from '@/lib/providers/extractQuery';
import { searchGoogleShopping, lookupAsin } from '@/lib/providers/googleShopping';
import { searchQuickCommerce } from '@/lib/providers/quickCommerce';

const QC_STORES = new Set(['blinkit', 'zepto', 'instamart', 'bigbasket']);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = body.url || body.query || '';
    const lat: number | undefined = body.lat;
    const lng: number | undefined = body.lng;
    const city: string | undefined = body.city;

    if (!input) {
      return NextResponse.json({ error: 'Provide a URL or search query' }, { status: 400 });
    }

    // Step 1: Extract query from input
    const extraction = extractSearchQuery(input);
    let searchQuery: string;

    if (extraction.type === 'asin') {
      console.log(`[Compare] ASIN detected: ${extraction.asin}`);
      searchQuery = await lookupAsin(extraction.asin);
      console.log(`[Compare] ASIN → "${searchQuery}"`);
    } else {
      searchQuery = extraction.query;
    }

    console.log(`[Compare] Searching: "${searchQuery}" city="${city || 'India'}"`);

    // Step 2: Search Google Shopping + Quick Commerce in parallel
    const [shoppingResults, qcResults] = await Promise.allSettled([
      searchGoogleShopping(searchQuery, city),
      searchQuickCommerce(searchQuery, lat, lng),
    ]);

    const allResults = [
      ...(shoppingResults.status === 'fulfilled' ? shoppingResults.value : []),
      ...(qcResults.status === 'fulfilled' ? qcResults.value : []),
    ];

    // Step 3: Deduplicate — keep cheapest per store
    const byStore = new Map<string, any>();
    for (const item of allResults) {
      if (!item.price || item.price <= 0) continue;
      const existing = byStore.get(item.store);
      if (!existing || item.price < existing.price) {
        byStore.set(item.store, item);
      }
    }

    const sorted = Array.from(byStore.values()).sort((a, b) => a.price - b.price);

    const response = {
      query: searchQuery,
      originalInput: input,
      product: {
        name: sorted[0]?.name || searchQuery,
        image: sorted[0]?.image || null,
      },
      prices: sorted,
      ecommerce: sorted.filter(p => !QC_STORES.has(p.store)),
      quickCommerce: sorted.filter(p => QC_STORES.has(p.store)),
      bestPrice: sorted[0] || null,
      totalStores: sorted.length,
      timestamp: new Date().toISOString(),
    };

    console.log(`[Compare] Returning ${sorted.length} prices`);
    return NextResponse.json(response);
  } catch (err: any) {
    console.error('[Compare API] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch prices', details: err.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q');
  const inputUrl = url.searchParams.get('url');
  if (!q && !inputUrl) {
    return NextResponse.json({ error: 'Add ?q=product or ?url=store-link' }, { status: 400 });
  }
  const body = inputUrl ? { url: inputUrl } : { query: q };
  const fakeReq = new Request(req.url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
  return POST(fakeReq);
}
