// Return types
export type ExtractionResult =
  | { type: 'query'; query: string }
  | { type: 'asin'; asin: string };

export function extractSearchQuery(input: string): ExtractionResult {
  const trimmed = input.trim();

  // Plain text — not a URL
  if (!trimmed.startsWith('http')) {
    return { type: 'query', query: trimmed };
  }

  try {
    const url = new URL(trimmed);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '');
    const path = decodeURIComponent(url.pathname);
    const params = url.searchParams;

    // Helper: decode param value
    const getParam = (...keys: string[]): string | null => {
      for (const key of keys) {
        const val = params.get(key);
        if (val) return val.replace(/\+/g, ' ').replace(/%2B/gi, ' ').trim();
      }
      return null;
    };

    // Helper: clean slug (dashes/underscores to spaces)
    const cleanSlug = (s: string): string =>
      s.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();

    // Helper: extract slug before /p/ or /dp/ etc
    const slugBefore = (marker: string): string | null => {
      const regex = new RegExp(`/([^/]+)/${marker}(/|$|\\?)`);
      const match = path.match(regex);
      return match ? cleanSlug(match[1]) : null;
    };

    // ══════════════════════════════════════════
    // AMAZON (amazon.in, amazon.com, m.amazon.in, amzn.in, amzn.to)
    // ══════════════════════════════════════════
    if (hostname.includes('amazon')) {
      // PRIORITY 1: Search params (most reliable)
      const kw = getParam('keywords', 'k', 'field-keywords');
      if (kw) return { type: 'query', query: kw };

      // PRIORITY 2: ASIN extraction (for product pages without keywords)
      // Real patterns: /dp/B0GSC1XN8N, /gp/product/B0DGJ4Y3HQ
      const asinMatch = path.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/);
      if (asinMatch) {
        // Check if slug before /dp/ is clean enough to use directly
        const slug = slugBefore('dp');
        if (slug) {
          const words = slug.split(' ');
          // Amazon slugs like "Apple-iPhone-16-128GB-Ultramarine" are clean
          // Slugs like "vivo-Northern-Storage-Additional-Exchange" are garbage
          // Heuristic: if slug contains a recognizable brand AND model number, use it
          const hasBrand = /^(apple|samsung|vivo|oneplus|xiaomi|redmi|realme|oppo|nothing|google|motorola|nokia|sony|lg|hp|dell|lenovo|asus|acer|boat|jbl|nike|adidas|puma)\b/i.test(slug);
          const hasModel = /\b(iphone|galaxy|pixel|macbook|thinkpad|air\s*max|v[0-9]{2}|a[0-9]{2}|s[0-9]{2}|pro\s*max|ultra)\b/i.test(slug);
          if (hasBrand && hasModel) {
            return { type: 'query', query: slug };
          }
        }
        // Fall back to ASIN lookup
        return { type: 'asin', asin: asinMatch[1] };
      }

      return { type: 'query', query: cleanSlug(path.split('/').filter(s => s.length > 3)[0] || input) };
    }

    // ══════════════════════════════════════════
    // FLIPKART (flipkart.com, dl.flipkart.com)
    // Real URLs:
    //   Product: /apple-iphone-16-black-128-gb/p/itmb07d67f995271
    //   Search:  /search?q=vivo+v70
    //   Review:  /apple-iphone-16-black-128-gb/product-reviews/itmb07d67f995271?pid=MOBH4DQFG8NKFRDY
    //   Category: /mobiles/apple~brand/pr?sid=tyy,4io
    // ══════════════════════════════════════════
    if (hostname.includes('flipkart')) {
      const q = getParam('q');
      if (q) return { type: 'query', query: q };

      // Product page: slug before /p/
      const slug = slugBefore('p');
      if (slug) return { type: 'query', query: slug };

      // Review page: slug before /product-reviews/
      const reviewSlug = slugBefore('product-reviews');
      if (reviewSlug) return { type: 'query', query: reviewSlug };

      // Category: first meaningful path segment
      const segments = path.split('/').filter(s => s.length > 2 && s !== 'dl');
      if (segments.length > 0) return { type: 'query', query: cleanSlug(segments[0]) };
    }

    // ══════════════════════════════════════════
    // MYNTRA (myntra.com)
    // Real URLs:
    //   Product: /sports-shoes/nike/nike-men-air-max-270-react/12345678/buy
    //   Search:  /sports-shoes?rawQuery=nike+air+max&p=1
    // ══════════════════════════════════════════
    if (hostname.includes('myntra')) {
      const q = getParam('rawQuery', 'q', 'query');
      if (q) return { type: 'query', query: q };

      // Product page: 3rd segment is usually brand+product
      const segments = path.split('/').filter(Boolean);
      if (segments.length >= 3) {
        return { type: 'query', query: cleanSlug(segments[2]) };
      }
      if (segments.length >= 1) {
        return { type: 'query', query: cleanSlug(segments[0]) };
      }
    }

    // ══════════════════════════════════════════
    // AJIO (ajio.com)
    // Real: /nike-air-max-270-react/p/469221001_white
    // Search: /search/?text=nike+air+max
    // ══════════════════════════════════════════
    if (hostname.includes('ajio')) {
      const q = getParam('text', 'q', 'query');
      if (q) return { type: 'query', query: q };

      const slug = slugBefore('p');
      if (slug) return { type: 'query', query: slug };
    }

    // ══════════════════════════════════════════
    // CROMA (croma.com)
    // Real: /apple-iphone-14-128gb-product-red-/p/261933
    // Search: /searchB?q=iphone+16&text=iphone+16
    // Category: /phones-wearables/mobile-phones/iphones/c/97
    // ══════════════════════════════════════════
    if (hostname.includes('croma')) {
      const q = getParam('q', 'text', 'searchText');
      if (q) return { type: 'query', query: q };

      const slug = slugBefore('p');
      if (slug) return { type: 'query', query: slug };

      // Category page: /category/c/ID
      const catMatch = path.match(/\/([^/]+)\/c\/\d+/);
      if (catMatch) return { type: 'query', query: cleanSlug(catMatch[1]) };
    }

    // ══════════════════════════════════════════
    // RELIANCE DIGITAL (reliancedigital.in)
    // Real: /product/samsung-galaxy-s25-ultra-5g-256-gb-12-gb-ram-titanium-grey-mobile-phone-m69dyg-8850633
    // Search: /search?q=iphone
    // ══════════════════════════════════════════
    if (hostname.includes('reliancedigital')) {
      const q = getParam('q', 'query');
      if (q) return { type: 'query', query: q };

      // Product page: /product/[slug-with-id-at-end]
      const prodMatch = path.match(/\/product\/(.+)/);
      if (prodMatch) {
        // Remove trailing product ID (last segment after last dash if it's alphanumeric code)
        const slug = prodMatch[1].replace(/-\d+$/, '').replace(/-[a-z0-9]{6,}$/i, '');
        return { type: 'query', query: cleanSlug(slug) };
      }
    }

    // ══════════════════════════════════════════
    // TATA CLIQ (tatacliq.com)
    // Real: /p-mp000000007636179/product-details
    // Category: /electronics/c-msh12
    // ══════════════════════════════════════════
    if (hostname.includes('tatacliq')) {
      const q = getParam('text', 'searchText', 'q');
      if (q) return { type: 'query', query: q };

      // Product with slug: /product-name/p/mp00000...
      const slug = slugBefore('p');
      if (slug) return { type: 'query', query: slug };

      // Direct product: /p-mp00000.../product-details
      const pMatch = path.match(/\/p-(mp\d+)/);
      if (pMatch) return { type: 'query', query: pMatch[1] };

      // Category
      const catMatch = path.match(/\/([^/]+)\/c-/);
      if (catMatch) return { type: 'query', query: cleanSlug(catMatch[1]) };
    }

    // ══════════════════════════════════════════
    // VIJAY SALES (vijaysales.com)
    // Real: /content/vijaysaleswebsite/us/en/product-details-page.html/251090/dell-14-plus-laptop-...
    // Category: /c/laptops
    // ══════════════════════════════════════════
    if (hostname.includes('vijaysales')) {
      const q = getParam('q', 'query', 'search');
      if (q) return { type: 'query', query: q };

      // Product page: last path segment is the slug
      const segments = path.split('/').filter(s => s.length > 5);
      if (segments.length > 0) {
        const lastSlug = segments[segments.length - 1];
        if (lastSlug.includes('-') && !lastSlug.includes('.html')) {
          return { type: 'query', query: cleanSlug(lastSlug) };
        }
      }

      // Category: /c/laptops
      const catMatch = path.match(/\/c\/([^/]+)/);
      if (catMatch) return { type: 'query', query: cleanSlug(catMatch[1]) };
    }

    // ══════════════════════════════════════════
    // BLINKIT (blinkit.com)
    // Real: /prn/go-daily-milk/prid/26915
    //       /s/?q=milk
    //       /cn/milk/cid/14/922
    // ══════════════════════════════════════════
    if (hostname.includes('blinkit')) {
      const q = getParam('q', 'query');
      if (q) return { type: 'query', query: q };

      // Product: /prn/product-name/prid/ID
      const prnMatch = path.match(/\/prn\/([^/]+)/);
      if (prnMatch) return { type: 'query', query: cleanSlug(prnMatch[1]) };

      // Category: /cn/category-name/cid/...
      const cnMatch = path.match(/\/cn\/([^/]+)/);
      if (cnMatch) return { type: 'query', query: cleanSlug(cnMatch[1]) };
    }

    // ══════════════════════════════════════════
    // ZEPTO (zeptonow.com, zepto.co)
    // Real: /pn/product-name/pvid/ID
    //       /search?query=milk
    //       /brand/Grocery
    // ══════════════════════════════════════════
    if (hostname.includes('zepto') || hostname.includes('zeptonow')) {
      const q = getParam('query', 'q');
      if (q) return { type: 'query', query: q };

      // Product: /pn/product-name/pvid/ID
      const pnMatch = path.match(/\/pn\/([^/]+)/);
      if (pnMatch) return { type: 'query', query: cleanSlug(pnMatch[1]) };

      // Brand page: /brand/BrandName
      const brandMatch = path.match(/\/brand\/([^/]+)/);
      if (brandMatch) return { type: 'query', query: cleanSlug(brandMatch[1]) };
    }

    // ══════════════════════════════════════════
    // SWIGGY INSTAMART (swiggy.com/instamart)
    // ══════════════════════════════════════════
    if (hostname.includes('swiggy')) {
      const q = getParam('query', 'q');
      if (q) return { type: 'query', query: q };

      // Product: /instamart/item/product-name/ID
      const itemMatch = path.match(/\/instamart\/item\/([^/]+)/);
      if (itemMatch) return { type: 'query', query: cleanSlug(itemMatch[1]) };

      // Category in path
      const segments = path.split('/').filter(s => s.length > 4 && s !== 'instamart');
      if (segments.length > 0) return { type: 'query', query: cleanSlug(segments[segments.length - 1]) };
    }

    // ══════════════════════════════════════════
    // BIGBASKET (bigbasket.com)
    // Real: /pd/40195179/amul-taaza-toned-fresh-milk-1-l-pouch/
    //       /ps/?q=amul+milk
    //       /pb/amul/ (brand page)
    //       /product-reviews/40188326/amul-99-cacao-ultimate-dark-chocolate/
    // ══════════════════════════════════════════
    if (hostname.includes('bigbasket')) {
      const q = getParam('q', 'query');
      if (q) return { type: 'query', query: q };

      // Product: /pd/ID/product-slug/
      const pdMatch = path.match(/\/pd\/\d+\/([^/]+)/);
      if (pdMatch) return { type: 'query', query: cleanSlug(pdMatch[1]) };

      // Product reviews: /product-reviews/ID/slug/
      const revMatch = path.match(/\/product-reviews\/\d+\/([^/]+)/);
      if (revMatch) return { type: 'query', query: cleanSlug(revMatch[1]) };

      // Brand page: /pb/brand-name/
      const pbMatch = path.match(/\/pb\/([^/]+)/);
      if (pbMatch) return { type: 'query', query: cleanSlug(pbMatch[1]) };
    }

    // ══════════════════════════════════════════
    // JIOMART (jiomart.com)
    // Real: /p/groceries/amul-taaza-toned-fresh-milk/593169
    //       /c/groceries/dairy-bakery/milk-milk-products/29011
    //       /search/amul+milk
    // ══════════════════════════════════════════
    if (hostname.includes('jiomart')) {
      const q = getParam('q', 'query');
      if (q) return { type: 'query', query: q };

      // Search: /search/query+terms
      const searchMatch = path.match(/\/search\/(.+)/);
      if (searchMatch) return { type: 'query', query: cleanSlug(searchMatch[1]) };

      // Product: /p/category/product-slug/ID
      const pMatch = path.match(/\/p\/[^/]+\/([^/]+)\/\d+/);
      if (pMatch) return { type: 'query', query: cleanSlug(pMatch[1]) };

      // Category: /c/groceries/subcategory/ID
      const cMatch = path.match(/\/c\/[^/]+\/([^/]+)/);
      if (cMatch) return { type: 'query', query: cleanSlug(cMatch[1]) };
    }

    // ══════════════════════════════════════════
    // NYKAA (nykaa.com)
    // Real: /maybelline-fit-me-foundation/p/123456
    //       /search/result/?q=maybelline
    //       /gadgets-tech-accessories/c/13860
    // ══════════════════════════════════════════
    if (hostname.includes('nykaa')) {
      const q = getParam('q', 'query');
      if (q) return { type: 'query', query: q };

      const slug = slugBefore('p');
      if (slug) return { type: 'query', query: slug };

      const catMatch = path.match(/\/([^/]+)\/c\/\d+/);
      if (catMatch) return { type: 'query', query: cleanSlug(catMatch[1]) };
    }

    // ══════════════════════════════════════════
    // SAMSUNG INDIA (samsung.com/in)
    // Real: /in/smartphones/galaxy-s25-ultra/
    // ══════════════════════════════════════════
    if (hostname.includes('samsung.com')) {
      const segments = path.replace(/^\/in\//, '').split('/').filter(s => s.length > 2);
      // Skip category, take product name
      if (segments.length >= 2) return { type: 'query', query: cleanSlug(segments[segments.length - 1]) };
      if (segments.length === 1) return { type: 'query', query: cleanSlug(segments[0]) };
    }

    // ══════════════════════════════════════════
    // APPLE INDIA (apple.com/in)
    // ══════════════════════════════════════════
    if (hostname.includes('apple.com')) {
      const segments = path.replace(/^\/in\//, '').split('/').filter(s => s.length > 2 && s !== 'shop' && s !== 'store');
      if (segments.length > 0) return { type: 'query', query: cleanSlug(segments[segments.length - 1]) };
    }

    // ══════════════════════════════════════════
    // GENERIC FALLBACK
    // ══════════════════════════════════════════
    const genericParam = getParam('q', 'k', 'query', 'search', 'keyword', 'keywords', 'text', 'searchText', 'rawQuery', 'field-keywords', 'term');
    if (genericParam) return { type: 'query', query: genericParam };

    const segments = path.split('/').filter(s =>
      s.length > 4 &&
      !/^(p|dp|c|s|pr|buy|product|search|category|details|reviews|item|page|html|content|result)$/i.test(s) &&
      !/^\d+$/.test(s)
    );
    if (segments.length > 0) {
      const best = segments.sort((a, b) => b.length - a.length)[0];
      return { type: 'query', query: cleanSlug(best) };
    }

    return { type: 'query', query: trimmed };
  } catch {
    return { type: 'query', query: trimmed };
  }
}
