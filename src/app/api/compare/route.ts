import { NextResponse } from 'next/server';
import { extractSearchQuery } from '@/lib/providers/extractQuery';
import { searchGoogleShopping } from '@/lib/providers/googleShopping';
import { searchQuickCommerce } from '@/lib/providers/quickCommerce';

const QC_STORES = new Set(['blinkit', 'zepto', 'instamart', 'bigbasket']);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = body.url || body.query || '';

    if (!input) {
      return NextResponse.json({ error: 'Please provide a URL or search query' }, { status: 400 });
    }

    // Extract clean search query from URL or plain text
    const searchQuery = extractSearchQuery(input);
    console.log(`[Compare API] Input: "${input}"`);
    console.log(`[Compare API] Extracted query: "${searchQuery}"`);

    // Search Google Shopping + Quick Commerce in parallel
    const [shoppingResults, qcResults] = await Promise.allSettled([
      searchGoogleShopping(searchQuery),
      searchQuickCommerce(searchQuery),
    ]);

    const allResults = [
      ...(shoppingResults.status === 'fulfilled' ? shoppingResults.value : []),
      ...(qcResults.status === 'fulfilled' ? qcResults.value : []),
    ];

    // Deduplicate: keep cheapest per store
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

    console.log(`[Compare API] Returning ${sorted.length} prices from ${sorted.map((p: any) => p.storeName).join(', ')}`);

    return NextResponse.json(response);
  } catch (err: any) {
    console.error('[Compare API] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch prices', details: err.message }, { status: 500 });
  }
}

// Also support GET for easy testing
export async function GET(req: Request) {
  const url = new URL(req.url);
  const query = url.searchParams.get('q');
  if (!query) {
    return NextResponse.json({ error: 'Add ?q=product+name to test' }, { status: 400 });
  }
  const fakeReq = new Request(req.url, {
    method: 'POST',
    body: JSON.stringify({ query }),
    headers: { 'Content-Type': 'application/json' },
  });
  return POST(fakeReq);
}
