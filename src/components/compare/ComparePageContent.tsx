"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Product, StorePrice, getProductBySearchQuery } from "@/lib/mockData";
import { ProductData } from "@/lib/types";
import ProductHeader from "@/components/compare/ProductHeader";
import PriceCard from "@/components/compare/PriceCard";
import QuickCommerceSection from "@/components/compare/QuickCommerceSection";
import PriceChart from "@/components/compare/PriceChart";
import AlertBox from "@/components/compare/AlertBox";

// ── Loading skeleton ─────────────────────────────────────────────────────────
function PricingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse flex gap-8">
        <div className="w-40 h-40 rounded-2xl bg-muted flex-shrink-0" />
        <div className="flex-1 space-y-4">
          <div className="h-6 w-24 bg-muted rounded" />
          <div className="h-8 w-3/4 bg-muted rounded" />
          <div className="flex gap-2">
            <div className="h-6 w-24 bg-muted rounded-lg" />
            <div className="h-6 w-24 bg-muted rounded-lg" />
          </div>
          <div className="h-20 w-2/3 bg-muted rounded-lg mt-6" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="rounded-lg border border-border bg-card p-5 space-y-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-20 bg-muted rounded" />
                <div className="h-3 w-32 bg-muted rounded" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-6 w-32 bg-muted rounded" />
              <div className="h-4 w-24 bg-muted rounded" />
            </div>
            <div className="h-10 bg-muted rounded-lg" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-border bg-card p-6 space-y-4 animate-pulse">
        <div className="h-6 w-32 bg-muted rounded" />
        <div className="h-80 bg-muted rounded-lg" />
      </div>
    </div>
  );
}

// ── Real product header (for URL-scraped products) ───────────────────────────
function RealProductHeader({ source, lowestPrice }: { source: ProductData; lowestPrice: number }) {
  const savings = source.mrp && source.mrp > lowestPrice ? source.mrp - lowestPrice : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mb-10"
    >
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Product image or emoji placeholder */}
        <div className="flex-shrink-0">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-gradient-to-br from-muted to-muted/50 border border-border overflow-hidden flex items-center justify-center"
          >
            {source.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={source.image}
                alt={source.name}
                className="w-full h-full object-contain p-2"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <span className="text-6xl">🛍️</span>
            )}
          </motion.div>
        </div>

        {/* Product info */}
        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/30">
              <span className="text-xs font-semibold text-accent">
                {source.category ?? source.store}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{source.name}</h1>

            {source.rating && (
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">★</span>
                <span className="text-sm font-medium">{source.rating.toFixed(1)}</span>
              </div>
            )}

            {savings > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="inline-block mt-4 px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/30"
              >
                <p className="text-sm text-muted-foreground mb-1">Potential Savings</p>
                <p className="text-xl font-bold text-green-400">
                  Up to ₹{savings.toLocaleString("en-IN")} vs MRP
                </p>
              </motion.div>
            )}

            <div className="flex items-baseline gap-3 pt-2">
              <span className="text-sm text-muted-foreground">Starting from:</span>
              <span className="text-2xl md:text-3xl font-bold font-mono text-accent">
                ₹{lowestPrice.toLocaleString("en-IN")}
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Convert API result to mock Product shape for existing components ──────────
function buildMockProduct(source: ProductData, prices: StorePrice[]): Product {
  const lowestPrice = prices.length
    ? Math.min(...prices.map(p => p.price))
    : source.price ?? 0;
  const highestMrp = source.mrp ?? lowestPrice;

  return {
    id: source.url,
    name: source.name,
    category: source.category ?? "Electronics",
    emoji: "🛍️",
    image: source.image ?? undefined,
    variant: undefined,
    storePrices: prices,
    priceHistory: [],
    lowestPrice,
    maxSavings: Math.max(0, highestMrp - lowestPrice),
  };
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ComparePageContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";

  const isUrl = q.startsWith("http://") || q.startsWith("https://");

  // For URL mode: real scraped data
  const [apiSource, setApiSource] = useState<ProductData | null>(null);
  const [apiPrices, setApiPrices] = useState<StorePrice[]>([]);
  const [apiCached, setApiCached] = useState(false);

  // For query mode: mock data
  const [mockProduct, setMockProduct] = useState<Product | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFromApi = useCallback(async (url: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json() as {
        success: boolean;
        source?: ProductData;
        prices?: StorePrice[];
        cached?: boolean;
        message?: string;
      };

      if (data.success && data.source) {
        setApiSource(data.source);
        setApiPrices(data.prices ?? []);
        setApiCached(data.cached ?? false);
      } else {
        // API failed — fall back to mock data using query string
        console.warn("[compare] API returned error, falling back to mock:", data.message);
        setError(data.message ?? "Could not fetch real prices.");
        setMockProduct(getProductBySearchQuery(url));
      }
    } catch (err) {
      console.error("[compare] fetch error:", err);
      setError("Network error. Showing cached data.");
      setMockProduct(getProductBySearchQuery(url));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isUrl) {
      fetchFromApi(q);
    } else {
      const timer = setTimeout(() => {
        setMockProduct(getProductBySearchQuery(q));
        setIsLoading(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [q, isUrl, fetchFromApi]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {isUrl && (
            <div className="mb-6 text-sm text-muted-foreground flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-accent animate-pulse" />
              Fetching live prices from all stores…
            </div>
          )}
          <PricingSkeleton />
        </div>
      </div>
    );
  }

  // ── URL mode: real data ─────────────────────────────────────────────────────
  if (isUrl && apiSource) {
    const regularStores = apiPrices.filter(s => !s.isQuickCommerce);
    const quickStores = apiPrices.filter(s => s.isQuickCommerce);
    const lowestRegular = regularStores.length
      ? Math.min(...regularStores.map(s => s.price))
      : 0;
    const lowestQC = quickStores.length
      ? Math.min(...quickStores.map(s => s.price))
      : 0;
    const lowestOverall = apiPrices.length
      ? Math.min(...apiPrices.map(s => s.price))
      : 0;

    // Build a mock Product for AlertBox and PriceChart (they need the full shape)
    const mockForChart = buildMockProduct(apiSource, apiPrices);

    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Cache indicator */}
          {apiCached && (
            <div className="mb-4 text-xs text-muted-foreground">
              Showing cached results (under 30 min old)
            </div>
          )}

          {/* Error notice (partial failure) */}
          {error && (
            <div className="mb-4 px-4 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-sm text-yellow-400">
              ⚠ {error}
            </div>
          )}

          {/* Real product header */}
          <RealProductHeader source={apiSource} lowestPrice={lowestOverall} />

          {/* No prices found */}
          {apiPrices.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
              <p className="text-lg font-medium mb-2">No prices found across stores</p>
              <p className="text-sm">
                The product may be blocked by store anti-bot measures. Try searching by name instead.
              </p>
            </div>
          ) : (
            <>
              {/* Regular e-commerce stores */}
              {regularStores.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <div className="mb-6">
                    <h2 className="text-xl font-bold mb-1">E-commerce Stores</h2>
                    <p className="text-sm text-muted-foreground">
                      Live prices across major platforms · sorted cheapest first
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {regularStores.map((store, i) => (
                      <PriceCard
                        key={store.id}
                        store={store}
                        isLowest={store.price === lowestRegular}
                        index={i}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Quick commerce */}
              {quickStores.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.15 }}
                  className="mt-12 pt-8 border-t border-border"
                >
                  <div className="mb-6">
                    <h2 className="flex items-center gap-2 text-xl font-bold mb-2">
                      <span>⚡</span>
                      <span>Quick Commerce — Delivered in minutes</span>
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Get your product faster with quick delivery services
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {quickStores.map((store, i) => (
                      <PriceCard
                        key={store.id}
                        store={store}
                        isLowest={store.price === lowestQC}
                        index={i}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Price chart (only if we have history; real data won't have it yet) */}
              {mockForChart.priceHistory.length > 0 && (
                <div className="mt-12">
                  <PriceChart product={mockForChart} />
                </div>
              )}

              <AlertBox product={mockForChart} />
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Query mode (mock) or URL mode fallback ────────────────────────────────
  const product = mockProduct;

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Product not found</h1>
          <p className="text-muted-foreground mb-6">
            We couldn&apos;t find the product you&apos;re looking for
          </p>
          <a
            href="/"
            className="inline-block px-6 py-2.5 rounded-lg bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition-colors"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  const regularStores = product.storePrices.filter(s => !s.isQuickCommerce);
  const lowestRegularPrice = Math.min(...regularStores.map(s => s.price));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ProductHeader product={product} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">E-commerce Stores</h2>
            <p className="text-sm text-muted-foreground">
              Compare prices across major e-commerce platforms
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {regularStores.map((store, index) => (
              <PriceCard
                key={store.id}
                store={store}
                isLowest={store.price === lowestRegularPrice}
                index={index}
              />
            ))}
          </div>
        </motion.div>

        <QuickCommerceSection product={product} />

        <div className="mt-12">
          <PriceChart product={product} />
        </div>

        <AlertBox product={product} />
      </div>
    </div>
  );
}
