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

// ── Accessory filter ──────────────────────────────────────────────────────────
const ACCESSORY_WORDS = [
  'case', 'cover', 'skin', 'wrap', 'screen guard', 'screen protector',
  'tempered glass', 'charger', 'cable', 'adapter', 'stand', 'mount',
  'holder', 'sticker', 'decal', 'pouch', 'sleeve', 'back cover',
  'flip cover', 'ring holder', 'grip', 'lens protector', 'camera guard',
  'bumper', 'armor', 'tpu', 'silicone case', 'clear case', 'wallet case',
];

function estimatePriceRange(q: string): { min: number; max: number } | null {
  const ql = q.toLowerCase();
  if (/iphone\s*1[6-9]/.test(ql)) return { min: 55000, max: 180000 };
  if (/iphone\s*1[0-5]/.test(ql)) return { min: 25000, max: 120000 };
  if (/galaxy\s*s2[0-9]/.test(ql)) return { min: 55000, max: 175000 };
  if (/galaxy\s*a[0-9]{2}/.test(ql)) return { min: 12000, max: 50000 };
  if (/galaxy\s*m[0-9]{2}/.test(ql)) return { min: 8000, max: 30000 };
  if (/vivo\s*v[0-9]{2}/.test(ql)) return { min: 15000, max: 50000 };
  if (/vivo\s*[txy][0-9]{2}/.test(ql)) return { min: 10000, max: 40000 };
  if (/oneplus\s*1[0-9]/.test(ql)) return { min: 25000, max: 80000 };
  if (/oneplus\s*nord/.test(ql)) return { min: 15000, max: 40000 };
  if (/pixel\s*[0-9]/.test(ql)) return { min: 35000, max: 110000 };
  if (/xiaomi|redmi|poco/.test(ql)) return { min: 7000, max: 60000 };
  if (/realme\s*(gt|narzo|[0-9])/.test(ql)) return { min: 8000, max: 45000 };
  if (/nothing\s*phone/.test(ql)) return { min: 25000, max: 50000 };
  if (/macbook/.test(ql)) return { min: 70000, max: 400000 };
  if (/ipad/.test(ql)) return { min: 30000, max: 180000 };
  if (/airpods/.test(ql)) return { min: 10000, max: 30000 };
  if (/wh.?1000|wf.?1000/.test(ql)) return { min: 15000, max: 35000 };
  if (/(laptop|notebook)/.test(ql)) return { min: 20000, max: 300000 };
  if (/\btv\b|television/.test(ql)) return { min: 10000, max: 500000 };
  if (/(phone|mobile|smartphone)/.test(ql)) return { min: 5000, max: 200000 };
  return null;
}

function filterResults(results: any[], query: string): any[] {
  const isDeviceSearch = /\b(iphone|samsung|galaxy|vivo|oneplus|xiaomi|redmi|realme|oppo|nothing|pixel|motorola|nokia|sony|lg|hp|dell|lenovo|asus|acer|macbook|ipad|airpods|headphone|earbuds|tv|television|laptop|tablet|watch|smartwatch)\b/i.test(query);

  if (!isDeviceSearch) return results; // Don't filter grocery/fashion searches

  const priceRange = estimatePriceRange(query);

  return results.filter(item => {
    const title = (item.title || '').toLowerCase();
    const price = item.extracted_price;

    // Remove accessories
    if (ACCESSORY_WORDS.some(word => title.includes(word))) return false;

    // Remove if price is way outside expected range
    if (priceRange && price < priceRange.min * 0.3) return false;
    if (priceRange && price > priceRange.max * 3) return false;

    return true;
  });
}

// ── Store name normalizer ─────────────────────────────────────────────────────
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
  return s.replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '-').slice(0, 30);
}

// ── Main search ───────────────────────────────────────────────────────────────
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

    const rawResults = data.shopping_results || [];
    console.log(`[SerpAPI] Raw results: ${rawResults.length}`);

    const filtered = filterResults(rawResults, query);
    console.log(`[SerpAPI] After filter: ${filtered.length}`);

    return filtered
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

// ── ASIN lookup via Google Search ─────────────────────────────────────────────
export async function lookupAsin(asin: string): Promise<string> {
  const apiKey = process.env.SERPAPI_KEY || '2ebbc2949510ba8a94ce7b81ff3006d7ea690d9f080786d33d68b250c361864d';

  const params = new URLSearchParams({
    engine: 'google',
    q: `site:amazon.in ${asin}`,
    gl: 'in',
    hl: 'en',
    api_key: apiKey,
    num: '3',
  });

  try {
    const res = await fetch(`https://serpapi.com/search.json?${params}`, {
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();

    const firstResult = data.organic_results?.[0];
    if (firstResult?.title) {
      const title = firstResult.title
        .replace(/^buy\s+/i, '')
        .replace(/\s*[-|:]\s*Amazon\.in.*$/i, '')
        .replace(/\s*Online\s*at\s*Low\s*Price.*$/i, '')
        .replace(/\s*\|.*$/i, '')
        .replace(/\(([^)]{20,})\)/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      console.log(`[ASIN Lookup] ${asin} → "${title}"`);
      return title;
    }
  } catch (err) {
    console.error(`[ASIN Lookup] Failed for ${asin}:`, err);
  }

  return asin;
}
