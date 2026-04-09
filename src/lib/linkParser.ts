import { ParsedLink } from './types';

export function parseProductLink(url: string): ParsedLink {
  let normalized: string;
  try {
    // Handle URLs without protocol
    const withProtocol = url.startsWith('http') ? url : `https://${url}`;
    normalized = new URL(withProtocol).href;
  } catch {
    return { store: 'unknown', productId: '' };
  }

  // ── Amazon ──────────────────────────────────────────────────────────────
  // amazon.in/dp/ASIN, amazon.in/gp/product/ASIN, short amzn.in links
  if (/amazon\.(in|com)/i.test(normalized) || /amzn\.in/i.test(normalized)) {
    const dpMatch = normalized.match(/\/dp\/([A-Z0-9]{10})/i);
    const gpMatch = normalized.match(/\/gp\/product\/([A-Z0-9]{10})/i);
    const asin = dpMatch?.[1] ?? gpMatch?.[1] ?? '';
    return { store: 'amazon', productId: asin.toUpperCase() };
  }

  // ── Flipkart ─────────────────────────────────────────────────────────────
  // flipkart.com/product-name/p/XXXXXXXXXXXXXXXX
  if (/flipkart\.com/i.test(normalized)) {
    const match = normalized.match(/\/p\/([A-Z0-9]+)/i);
    return { store: 'flipkart', productId: match?.[1] ?? '' };
  }

  // ── Croma ────────────────────────────────────────────────────────────────
  // croma.com/product-name/p/XXXXXXXX
  if (/croma\.com/i.test(normalized)) {
    const match = normalized.match(/\/p\/([0-9]+)/i);
    return { store: 'croma', productId: match?.[1] ?? '' };
  }

  // ── Blinkit ──────────────────────────────────────────────────────────────
  // blinkit.com/prn/product-name/prid/12345
  if (/blinkit\.com/i.test(normalized)) {
    const match = normalized.match(/\/prid\/([0-9]+)/i);
    return { store: 'blinkit', productId: match?.[1] ?? '' };
  }

  // ── Zepto ────────────────────────────────────────────────────────────────
  // zeptonow.com/product/XXXXX or zepto.co/product/XXXXX
  if (/zepto(now)?\.co/i.test(normalized)) {
    const match = normalized.match(/\/product\/([a-zA-Z0-9_-]+)/i);
    return { store: 'zepto', productId: match?.[1] ?? '' };
  }

  // ── Myntra ───────────────────────────────────────────────────────────────
  // myntra.com/category/brand-name/buy/12345/12345
  if (/myntra\.com/i.test(normalized)) {
    // product ID is typically the last numeric segment before query string
    const path = new URL(normalized).pathname;
    const segments = path.split('/').filter(Boolean);
    const lastNumeric = [...segments].reverse().find(s => /^\d+$/.test(s));
    return { store: 'myntra', productId: lastNumeric ?? '' };
  }

  // ── Ajio ─────────────────────────────────────────────────────────────────
  // ajio.com/product-name/p/XXXXXXXX
  if (/ajio\.com/i.test(normalized)) {
    const match = normalized.match(/\/p\/([A-Z0-9]+)/i);
    return { store: 'ajio', productId: match?.[1] ?? '' };
  }

  return { store: 'unknown', productId: '' };
}
