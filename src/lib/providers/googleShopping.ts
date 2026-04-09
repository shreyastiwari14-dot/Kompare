export interface ShoppingResult {
  name: string;
  price: number;
  store: string;
  storeName: string;
  url: string;
  image: string | null;
  rating: number | null;
  reviews: number | null;
  delivery: string | null;
}

export async function searchGoogleShopping(query: string): Promise<ShoppingResult[]> {
  const apiKey = process.env.SERPAPI_KEY || '2ebbc2949510ba8a94ce7b81ff3006d7ea690d9f080786d33d68b250c361864d';

  const params = new URLSearchParams({
    engine: 'google_shopping',
    q: query,
    gl: 'in',
    hl: 'en',
    location: 'India',
    api_key: apiKey,
    num: '20',
  });

  console.log(`[SerpAPI] Searching: "${query}"`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(`https://serpapi.com/search.json?${params.toString()}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[SerpAPI] HTTP ${res.status}: ${errText}`);
      return [];
    }

    const data = await res.json();

    if (data.error) {
      console.error(`[SerpAPI] Error: ${data.error}`);
      return [];
    }

    const results = data.shopping_results || [];
    console.log(`[SerpAPI] Got ${results.length} results`);

    return results
      .filter((item: any) => item.extracted_price && item.extracted_price > 0)
      .map((item: any) => ({
        name: item.title || '',
        price: item.extracted_price,
        store: normalizeStoreName(item.source || ''),
        storeName: item.source || 'Unknown Store',
        url: item.link || item.product_link || '#',
        image: item.thumbnail || null,
        rating: item.rating || null,
        reviews: item.reviews || null,
        delivery: item.delivery || null,
      }));
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      console.error('[SerpAPI] Request timed out after 20s');
    } else {
      console.error('[SerpAPI] Fetch error:', err.message);
    }
    return [];
  }
}

function normalizeStoreName(source: string): string {
  const s = source.toLowerCase();
  if (s.includes('amazon')) return 'amazon';
  if (s.includes('flipkart')) return 'flipkart';
  if (s.includes('croma')) return 'croma';
  if (s.includes('reliance digital') || s.includes('reliancedigital')) return 'reliance';
  if (s.includes('tata cliq') || s.includes('tatacliq')) return 'tatacliq';
  if (s.includes('vijay sales') || s.includes('vijaysales')) return 'vijaysales';
  if (s.includes('myntra')) return 'myntra';
  if (s.includes('ajio')) return 'ajio';
  if (s.includes('nykaa')) return 'nykaa';
  if (s.includes('samsung')) return 'samsung';
  if (s.includes('apple')) return 'apple';
  if (s.includes('jiomart') || s.includes('jio mart')) return 'jiomart';
  // Keep the original name cleaned up for unknown stores
  return s.replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '-').slice(0, 30);
}
