import { NextResponse } from 'next/server';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-IN,en;q=0.9',
};

const STORE_PROBES: Record<string, string> = {
  amazon:   'https://www.amazon.in/robots.txt',
  flipkart: 'https://www.flipkart.com/robots.txt',
  croma:    'https://www.croma.com/robots.txt',
  reliance: 'https://www.reliancedigital.in/robots.txt',
  myntra:   'https://www.myntra.com/robots.txt',
  ajio:     'https://www.ajio.com/robots.txt',
  blinkit:  'https://blinkit.com/robots.txt',
  zepto:    'https://www.zepto.co/robots.txt',
  bigbasket:'https://www.bigbasket.com/robots.txt',
};

interface StoreStatus {
  status: 'ok' | 'blocked' | 'error' | 'timeout';
  httpStatus?: number;
  latencyMs?: number;
  note?: string;
}

async function probeStore(storeName: string, probeUrl: string): Promise<StoreStatus> {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);

  try {
    const res = await fetch(probeUrl, {
      headers: HEADERS,
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timer);
    const latencyMs = Date.now() - start;
    const text = await res.text().catch(() => '');

    if (res.status === 403 || res.status === 429 || res.status === 401) {
      return { status: 'blocked', httpStatus: res.status, latencyMs };
    }
    if (res.status >= 500) {
      return { status: 'error', httpStatus: res.status, latencyMs };
    }
    if (res.status === 200 && text.length > 10) {
      return { status: 'ok', httpStatus: res.status, latencyMs };
    }
    return { status: 'error', httpStatus: res.status, latencyMs, note: 'empty response' };
  } catch (err) {
    clearTimeout(timer);
    const latencyMs = Date.now() - start;
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    return {
      status: isTimeout ? 'timeout' : 'error',
      latencyMs,
      note: isTimeout ? 'Request timed out' : String(err),
    };
  }
}

export async function GET(): Promise<NextResponse> {
  const entries = Object.entries(STORE_PROBES);
  const settled = await Promise.allSettled(
    entries.map(([store, url]) => probeStore(store, url))
  );

  const results: Record<string, StoreStatus> = {};
  settled.forEach((result, i) => {
    const store = entries[i][0];
    results[store] = result.status === 'fulfilled'
      ? result.value
      : { status: 'error', note: String(result.reason) };
  });

  const summary = {
    ok:      Object.values(results).filter(r => r.status === 'ok').length,
    blocked: Object.values(results).filter(r => r.status === 'blocked').length,
    error:   Object.values(results).filter(r => r.status === 'error').length,
    timeout: Object.values(results).filter(r => r.status === 'timeout').length,
  };

  console.log('[debug] store probe results:', summary);

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    summary,
    stores: results,
  });
}
