import { ProductData } from '@/lib/types';
import { searchAmazon } from './amazonSearch';
import { searchFlipkart } from './flipkartSearch';
import { searchBlinkit } from './blinkitSearch';
import { searchZepto } from './zeptoSearch';
import { searchCroma } from './cromaSearch';

const SEARCH_TIMEOUT_MS = 8000;

type StoreKey = 'amazon' | 'flipkart' | 'blinkit' | 'zepto' | 'croma';

const SEARCHERS: Record<StoreKey, (q: string) => Promise<ProductData[]>> = {
  amazon: searchAmazon,
  flipkart: searchFlipkart,
  blinkit: searchBlinkit,
  zepto: searchZepto,
  croma: searchCroma,
};

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(
      val => { clearTimeout(timer); resolve(val); },
      err => { clearTimeout(timer); reject(err); }
    );
  });
}

/**
 * Search all stores in parallel. Skip stores listed in `excludeStores`.
 * Never throws — returns all results that came back within the timeout.
 */
export async function searchAllStores(
  productName: string,
  modelNumber?: string | null,
  excludeStores: StoreKey[] = []
): Promise<ProductData[]> {
  const query = modelNumber
    ? `${productName} ${modelNumber}`.trim()
    : productName;

  console.log('[searchAllStores] query:', query, '| excluding:', excludeStores);

  const activeStores = (Object.keys(SEARCHERS) as StoreKey[]).filter(
    s => !excludeStores.includes(s)
  );

  const settled = await Promise.allSettled(
    activeStores.map(store =>
      withTimeout(SEARCHERS[store](query), SEARCH_TIMEOUT_MS, store)
    )
  );

  const all: ProductData[] = [];
  settled.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      all.push(...result.value);
    } else {
      console.warn(`[searchAllStores] ${activeStores[i]} failed:`, result.reason);
    }
  });

  console.log(`[searchAllStores] total candidates: ${all.length}`);
  return all;
}
