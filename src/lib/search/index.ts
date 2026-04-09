import { ProductData } from '@/lib/types';
import { searchAmazon } from './amazonSearch';
import { searchFlipkart } from './flipkartSearch';
import { searchBlinkit } from './blinkitSearch';
import { searchZepto } from './zeptoSearch';
import { searchCroma } from './cromaSearch';
import { searchReliance } from './relianceSearch';
import { searchMyntra } from './myntraSearch';
import { searchAjio } from './ajioSearch';
import { searchBigbasket } from './bigbasketSearch';

const SEARCH_TIMEOUT_MS = 10_000;

export type StoreKey =
  | 'amazon' | 'flipkart' | 'blinkit' | 'zepto' | 'croma'
  | 'reliance' | 'myntra' | 'ajio' | 'bigbasket';

const SEARCHERS: Record<StoreKey, (q: string) => Promise<ProductData[]>> = {
  amazon:   searchAmazon,
  flipkart: searchFlipkart,
  blinkit:  searchBlinkit,
  zepto:    searchZepto,
  croma:    searchCroma,
  reliance: searchReliance,
  myntra:   searchMyntra,
  ajio:     searchAjio,
  bigbasket: searchBigbasket,
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
 * Logs each store's outcome for debugging.
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
      console.log(`[searchAllStores] ${activeStores[i]}: ${result.value.length} results`);
      all.push(...result.value);
    } else {
      console.warn(`[searchAllStores] ${activeStores[i]} failed:`, result.reason?.message ?? result.reason);
    }
  });

  console.log(`[searchAllStores] total candidates: ${all.length}`);
  return all;
}
