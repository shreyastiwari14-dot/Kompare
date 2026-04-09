/** Shared fetch helper: retry with exponential backoff, 5-second timeout, real UA */

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export const HEADERS: Record<string, string> = {
  'User-Agent': USER_AGENT,
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
  Connection: 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Cache-Control': 'max-age=0',
};

export const JSON_HEADERS: Record<string, string> = {
  'User-Agent': USER_AGENT,
  Accept: 'application/json, */*;q=0.8',
  'Accept-Language': 'en-IN,en;q=0.9',
  'Content-Type': 'application/json',
};

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxAttempts = 3
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[scraper] fetch attempt ${attempt}/${maxAttempts}: ${url}`);
      const response = await fetchWithTimeout(url, options);
      // Always return the response — let the scraper decide what to do with non-200s.
      // Only retry on network-level errors, 429 (rate limit), or 5xx server errors.
      if (response.status === 429 || response.status >= 500) {
        lastError = new Error(`HTTP ${response.status}`);
        console.warn(`[scraper] retriable status ${response.status} on attempt ${attempt}`);
      } else {
        return response; // includes 200, 301, 302, 404, etc.
      }
    } catch (err) {
      lastError = err;
      console.warn(`[scraper] attempt ${attempt} failed:`, err);
    }
    if (attempt < maxAttempts) {
      const delay = 500 * 2 ** (attempt - 1); // 500ms, 1s, 2s
      console.log(`[scraper] retrying in ${delay}ms…`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastError;
}

/** Pull price digits out of messy strings like "₹1,29,990" → 129990 */
export function parsePrice(raw: string | undefined | null): number | null {
  if (!raw) return null;
  const digits = raw.replace(/[^0-9]/g, '');
  return digits ? parseInt(digits, 10) : null;
}

/** Extract the first JSON-LD block of type Product from an HTML string */
export function extractJsonLd(html: string): Record<string, unknown> | null {
  const matches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const m of matches) {
    try {
      const json = JSON.parse(m[1]);
      const candidates = Array.isArray(json) ? json : [json];
      for (const c of candidates) {
        if (c['@type'] === 'Product') return c as Record<string, unknown>;
      }
    } catch { /* skip malformed blocks */ }
  }
  return null;
}
