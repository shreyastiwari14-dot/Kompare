"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { StorePrice } from "@/lib/mockData";
import PriceCard from "@/components/compare/PriceCard";
import AlertBox from "@/components/compare/AlertBox";
import Breadcrumb from "@/components/ui/Breadcrumb";

// ── Loading skeleton ──────────────────────────────────────────────────────────
function PricingSkeleton({ message }: { message?: string }) {
  return (
    <div className="space-y-6">
      {message && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-block w-2 h-2 rounded-full bg-accent animate-pulse" />
          {message}
        </div>
      )}
      <div className="animate-pulse flex gap-8">
        <div className="w-40 h-40 rounded-2xl bg-muted flex-shrink-0" />
        <div className="flex-1 space-y-4">
          <div className="h-6 w-24 bg-muted rounded" />
          <div className="h-8 w-3/4 bg-muted rounded" />
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
    </div>
  );
}

// ── Extract variant pills from product name ───────────────────────────────────
function extractVariantPills(name: string): string[] {
  const pills: string[] = [];
  const storageMatch = name.match(/\b(\d+\s*(?:GB|TB))\b/gi);
  if (storageMatch) pills.push(...storageMatch.map(s => s.replace(/\s+/, ' ').toUpperCase()));
  const colorMatch = name.match(/\b(Black|White|Blue|Red|Green|Gold|Silver|Graphite|Midnight|Starlight|Titanium|Natural|Pink|Purple|Yellow|Violet)\b/gi);
  if (colorMatch) pills.push(...colorMatch.map(c => c.charAt(0).toUpperCase() + c.slice(1).toLowerCase()));
  return [...new Set(pills)].slice(0, 4);
}

// ── Product header ────────────────────────────────────────────────────────────
function ProductHeader({ name, image, lowestPrice, lowestStoreName, totalStores }: {
  name: string;
  image?: string | null;
  lowestPrice: number;
  lowestStoreName?: string;
  totalStores: number;
}) {
  const variantPills = extractVariantPills(name);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-10"
    >
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8 items-start">
        {/* Image */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full aspect-square max-w-[240px] rounded-2xl bg-gradient-to-br from-muted to-muted/50 border border-border overflow-hidden flex items-center justify-center"
        >
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={name}
              className="w-full h-full object-contain p-4"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <span className="text-7xl">🛍️</span>
          )}
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="space-y-4 pt-1"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-semibold text-green-600 dark:text-green-400">
              Found on {totalStores} store{totalStores !== 1 ? 's' : ''}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold tracking-tight leading-snug">{name}</h1>

          {variantPills.length > 0 && (
            <div className="flex items-center flex-wrap gap-2">
              {variantPills.map(pill => (
                <span
                  key={pill}
                  className="px-3 py-1 rounded-full border border-border bg-muted text-xs font-medium text-muted-foreground"
                >
                  {pill}
                </span>
              ))}
            </div>
          )}

          <div className="pt-2 space-y-1">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl md:text-4xl font-bold font-mono tabular-nums text-accent">
                ₹{lowestPrice.toLocaleString("en-IN")}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Best price{lowestStoreName ? ` on ${lowestStoreName}` : " across all stores"}
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ── API response type ─────────────────────────────────────────────────────────
interface CompareApiResponse {
  success: boolean;
  query?: string;
  product?: { name: string; image?: string | null };
  prices?: (StorePrice & { url?: string })[];
  ecommerce?: (StorePrice & { url?: string })[];
  quickCommerce?: (StorePrice & { url?: string })[];
  bestPrice?: StorePrice | null;
  totalStores?: number;
  cached?: boolean;
  message?: string;
}

// ── Sort helper ───────────────────────────────────────────────────────────────
type SortKey = "price" | "discount" | "delivery";

function sortStores(stores: (StorePrice & { url?: string })[], key: SortKey) {
  return [...stores].sort((a, b) => {
    if (key === "price")    return a.price - b.price;
    if (key === "discount") return (b.discount ?? 0) - (a.discount ?? 0);
    if (key === "delivery") {
      const score = (s: StorePrice) => {
        const info = s.deliveryInfo.toLowerCase();
        if (info.includes("min")) return 0;
        if (info.includes("today") || info.includes("tomorrow")) return 1;
        return 2;
      };
      return score(a) - score(b);
    }
    return 0;
  });
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ComparePageContent() {
  const searchParams = useSearchParams();
  const urlParam = searchParams.get("url") ?? "";
  const qParam   = searchParams.get("q")   ?? "";
  const q = urlParam || qParam;

  const isUrl = q.startsWith("http://") || q.startsWith("https://");

  const [sortBy, setSortBy] = useState<SortKey>("price");
  const [product, setProduct]       = useState<{ name: string; image?: string | null } | null>(null);
  const [ecommerce, setEcommerce]   = useState<(StorePrice & { url?: string })[]>([]);
  const [qcPrices, setQcPrices]     = useState<(StorePrice & { url?: string })[]>([]);
  const [totalStores, setTotalStores] = useState(0);
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [isCached, setIsCached]     = useState(false);

  const fetchPrices = useCallback(async (input: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const payload = input.startsWith("http") ? { url: input } : { query: input };
      const res  = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: CompareApiResponse = await res.json();

      if (data.success) {
        setProduct(data.product ?? null);
        setEcommerce(data.ecommerce ?? []);
        setQcPrices(data.quickCommerce ?? []);
        setTotalStores(data.totalStores ?? 0);
        setIsCached(data.cached ?? false);
      } else {
        setError(data.message ?? "Could not fetch prices.");
      }
    } catch (err) {
      setError("Network error — please try again.");
      console.error("[compare]", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (q) fetchPrices(q);
    else setIsLoading(false);
  }, [q, fetchPrices]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <PricingSkeleton message="Scanning stores for the best price…" />
        </div>
      </div>
    );
  }

  // ── No query ───────────────────────────────────────────────────────────────
  if (!q) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Paste a product link or search</h1>
          <p className="text-muted-foreground">Use the search bar on the home page to compare prices.</p>
          <a href="/" className="inline-block px-6 py-2.5 rounded-lg bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition-colors">
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  // ── No results ─────────────────────────────────────────────────────────────
  if (!isLoading && ecommerce.length === 0 && qcPrices.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Compare", href: "/compare" }, { label: "No results" }]} />
          {error && (
            <div className="mb-4 px-4 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-sm text-yellow-500">
              ⚠ {error}
            </div>
          )}
          <div className="rounded-lg border border-border bg-card p-10 text-center">
            <p className="text-lg font-semibold mb-2">
              No prices found for &ldquo;{product?.name || q}&rdquo;
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Try a more specific search term — e.g. &ldquo;iPhone 16 128GB&rdquo; instead of just &ldquo;iPhone&rdquo;.
            </p>
            <a href="/" className="inline-block px-6 py-2.5 rounded-lg bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition-colors">
              Try another search
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── Results ────────────────────────────────────────────────────────────────
  const allPrices    = [...ecommerce, ...qcPrices];
  const lowestPrice  = allPrices.length ? Math.min(...allPrices.map(s => s.price)) : 0;
  const lowestStore  = allPrices.find(s => s.price === lowestPrice);

  const sortedEcom   = sortStores(ecommerce, sortBy);
  const sortedQC     = sortStores(qcPrices,  sortBy);
  const lowestEcom   = sortedEcom.length ? Math.min(...sortedEcom.map(s => s.price)) : 0;
  const lowestQC     = sortedQC.length  ? Math.min(...sortedQC.map(s => s.price))  : 0;

  const breadcrumbName = (product?.name ?? q).slice(0, 50) + ((product?.name ?? q).length > 50 ? "…" : "");

  // Minimal product object for AlertBox
  const alertProduct = {
    id: q,
    name: product?.name ?? q,
    category: "Product",
    emoji: "🛍️",
    image: product?.image ?? undefined,
    storePrices: allPrices,
    priceHistory: [],
    lowestPrice,
    maxSavings: 0,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Breadcrumb */}
        <Breadcrumb items={[
          { label: "Home", href: "/" },
          { label: "Compare", href: "/compare" },
          { label: breadcrumbName },
        ]} />

        {/* Cache indicator */}
        {isCached && (
          <div className="mb-4 text-xs text-muted-foreground">
            Showing cached results (under 30 min old)
          </div>
        )}

        {/* Error banner (partial failure) */}
        {error && (
          <div className="mb-4 px-4 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-sm text-yellow-500">
            ⚠ {error}
          </div>
        )}

        {/* Product header */}
        {product && (
          <ProductHeader
            name={product.name}
            image={product.image}
            lowestPrice={lowestPrice}
            lowestStoreName={lowestStore?.storeName}
            totalStores={totalStores}
          />
        )}

        {/* Sort pills */}
        {(sortedEcom.length > 0 || sortedQC.length > 0) && (
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <span className="text-sm text-muted-foreground mr-1">Sort:</span>
            {(["price", "discount", "delivery"] as const).map(key => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all border ${
                  sortBy === key
                    ? "bg-accent text-accent-foreground border-accent"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                }`}
              >
                {key === "price" ? "Price ↑" : key === "discount" ? "Discount" : "Delivery"}
              </button>
            ))}
          </div>
        )}

        {/* E-commerce stores */}
        {sortedEcom.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-1">E-commerce Stores</h2>
              <p className="text-sm text-muted-foreground">
                Live prices via Google Shopping · sorted cheapest first
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {sortedEcom.map((store, i) => (
                <PriceCard
                  key={store.id}
                  store={store}
                  isLowest={store.price === lowestEcom}
                  index={i}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Quick Commerce */}
        {sortedQC.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-12"
          >
            {/* Divider with label */}
            <div className="relative flex items-center mb-8">
              <div className="flex-1 border-t border-border" />
              <span className="mx-4 flex items-center gap-2 text-sm font-semibold text-muted-foreground whitespace-nowrap">
                <span>⚡</span>
                <span>Faster Delivery Options</span>
              </span>
              <div className="flex-1 border-t border-border" />
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold mb-1">Quick Commerce</h2>
              <p className="text-sm text-muted-foreground">Get your product delivered in minutes</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedQC.map((store, i) => (
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

        {/* Price Alert */}
        {allPrices.length > 0 && (
          <AlertBox product={alertProduct} />
        )}
      </div>
    </div>
  );
}
