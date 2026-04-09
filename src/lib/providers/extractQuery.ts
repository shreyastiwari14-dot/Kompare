export function extractSearchQuery(input: string): string {
  const trimmed = input.trim();

  // If it's not a URL, it's already a search query
  if (!trimmed.startsWith('http')) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const hostname = url.hostname.toLowerCase();
    const path = url.pathname;
    const params = url.searchParams;

    // AMAZON search page: /s?k=samsung+galaxy+a55+5g
    if (hostname.includes('amazon')) {
      const kParam = params.get('k');
      if (kParam) return kParam.replace(/\+/g, ' ');
      // Amazon product page: /Product-Name-Here/dp/ASIN
      const dpMatch = path.match(/\/([^/]+)\/dp\//);
      if (dpMatch) return dpMatch[1].replace(/-/g, ' ');
      // Amazon product page: /gp/product/ASIN
      const gpMatch = path.match(/\/gp\/product\/([^/]+)/);
      if (gpMatch) return gpMatch[1];
    }

    // FLIPKART search page: /search?q=samsung+galaxy+a55
    if (hostname.includes('flipkart')) {
      const qParam = params.get('q');
      if (qParam) return qParam.replace(/\+/g, ' ');
      // Flipkart product page: /product-name-slug/p/ITEMID
      const prodMatch = path.match(/^\/([^/]+)\/p\//);
      if (prodMatch) return prodMatch[1].replace(/-/g, ' ');
      // Flipkart category/listing: /brand-name/pr?sid=...
      const prMatch = path.match(/^\/([^/]+)\/pr/);
      if (prMatch) return prMatch[1].replace(/-/g, ' ');
    }

    // CROMA
    if (hostname.includes('croma')) {
      const qParam = params.get('q') || params.get('text');
      if (qParam) return qParam.replace(/\+/g, ' ');
      // Product page: /product-name/p/XXXXX
      const prodMatch = path.match(/\/([^/]+)\/p\//);
      if (prodMatch) return prodMatch[1].replace(/-/g, ' ');
    }

    // MYNTRA
    if (hostname.includes('myntra')) {
      const qParam = params.get('rawQuery') || params.get('q');
      if (qParam) return qParam;
      // Product page: /brand/product-name/ID/buy
      const segments = path.split('/').filter(Boolean);
      if (segments.length >= 2) return segments.slice(0, 2).join(' ').replace(/-/g, ' ');
    }

    // AJIO
    if (hostname.includes('ajio')) {
      const textParam = params.get('text') || params.get('query');
      if (textParam) return textParam;
      const segments = path.split('/').filter(s => s.length > 3);
      if (segments.length > 0) return segments[segments.length - 1].replace(/-/g, ' ');
    }

    // RELIANCE DIGITAL
    if (hostname.includes('reliancedigital')) {
      const qParam = params.get('q');
      if (qParam) return qParam;
      const segments = path.split('/').filter(s => s.length > 3);
      if (segments.length > 0) return segments[segments.length - 1].replace(/-/g, ' ');
    }

    // TATA CLIQ
    if (hostname.includes('tatacliq')) {
      const qParam = params.get('searchText') || params.get('q');
      if (qParam) return qParam;
      const segments = path.split('/').filter(s => s.length > 3);
      if (segments.length > 0) return segments[segments.length - 1].replace(/-/g, ' ');
    }

    // VIJAY SALES
    if (hostname.includes('vijaysales')) {
      const qParam = params.get('q') || params.get('search');
      if (qParam) return qParam;
    }

    // BLINKIT
    if (hostname.includes('blinkit')) {
      const qParam = params.get('q') || params.get('query');
      if (qParam) return qParam;
      // Product page: /prn/product-name/prid/ID
      const prnMatch = path.match(/\/prn\/([^/]+)/);
      if (prnMatch) return prnMatch[1].replace(/-/g, ' ');
    }

    // ZEPTO
    if (hostname.includes('zepto')) {
      const qParam = params.get('query') || params.get('q');
      if (qParam) return qParam;
      const segments = path.split('/').filter(s => s.length > 3);
      if (segments.length > 0) return segments[segments.length - 1].replace(/-/g, ' ');
    }

    // SWIGGY INSTAMART
    if (hostname.includes('swiggy')) {
      const qParam = params.get('query') || params.get('q');
      if (qParam) return qParam;
    }

    // BIGBASKET
    if (hostname.includes('bigbasket')) {
      const qParam = params.get('q');
      if (qParam) return qParam;
      const slugParam = path.match(/\/ps\/\?q=([^&]+)/);
      if (slugParam) return slugParam[1];
    }

    // NYKAA
    if (hostname.includes('nykaa')) {
      const qParam = params.get('q') || params.get('query');
      if (qParam) return qParam;
    }

    // JIOMART
    if (hostname.includes('jiomart')) {
      const qParam = params.get('q') || params.get('query');
      if (qParam) return qParam;
      const segments = path.split('/').filter(s => s.length > 3);
      if (segments.length > 0) return segments[segments.length - 1].replace(/-/g, ' ');
    }

    // GENERIC FALLBACK: try common search params, then URL path
    for (const key of ['q', 'k', 'query', 'search', 'keyword', 'text', 'searchText', 'rawQuery']) {
      const val = params.get(key);
      if (val) return val.replace(/\+/g, ' ');
    }

    // Last resort: longest path segment
    const segments = path.split('/').filter(s => s.length > 4 && !['dp','p','pr','buy','product','search','category'].includes(s));
    if (segments.length > 0) {
      return segments.sort((a, b) => b.length - a.length)[0].replace(/[-_]/g, ' ');
    }

    return trimmed; // Return the raw URL as query if nothing worked
  } catch {
    return trimmed;
  }
}
