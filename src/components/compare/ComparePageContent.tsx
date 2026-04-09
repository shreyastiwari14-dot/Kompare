"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import type { ShoppingResult } from "@/lib/providers/googleShopping";
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
  const colorMatch = name.match(/\b(Black|White|Blue|Red|Green|Gold|Silver|Graphite|Midnight|Starlight|Titanium|Natural|Pink|Purple|Yellow|Violet|Navy|Ivory|Lilac|Awesome)\b/gi);
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

// ── Search bar at top of results ──────────────────────────────────────────────
function SearchAgainBar() {
  const router = useRouter();
  const [val, setVal] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = val.trim();
    if (!trimmed) return;
    const looksLikeUrl =
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://") ||
      /^(www\.)?(amazon|flipkart|croma|myntra|ajio|reliance|zepto|blinkit|swiggy|bigbasket|nykaa|tatacliq|jiomart)\.(in|com)/i.test(trimmed);
    if (looksLikeUrl) {
      const full = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
      router.push(`/compare?url=${encodeURIComponent(full)}`);
    } else {
      router.push(`/compare?q=${encodeURIComponent(trimmed)}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-8">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={val}
          onChange={e => setVal(e.target.value)}
          placeholder="Search another product or paste a URL…"
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-muted text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent text-sm"
        />
      </div>
      <button
        type="submit"
        className="px-4 py-2.5 rounded-lg bg-accent text-accent-foreground font-semibold text-sm hover:bg-accent/90 transition-colors active:scale-95"
      >
        Compare
      </button>
    </form>
  );
}

// ── API response type ─────────────────────────────────────────────────────────
interface CompareApiResponse {
  query?: string;
  product?: { name: string; image?: string | null };
  prices?: ShoppingResult[];
  ecommerce?: ShoppingResult[];
  quickCommerce?: ShoppingResult[];
  bestPrice?: ShoppingResult | null;
  totalStores?: number;
  error?: string;
}

type SortKey = "price" | "delivery";

function sortResults(items: ShoppingResult[], key: SortKey): ShoppingResult[] {
  return [...items].sort((a, b) => {
    if (key === "price") return a.price - b.price;
    if (key === "delivery") {
      const score = (s: ShoppingResult) => {
        const d = (s.delivery || '').toLowerCase();
        if (d.includes('min')) return 0;
        if (d.includes('today') || d.includes('same')) return 1;
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
  const input = urlParam || qParam;

  const [sortBy, setSortBy] = useState<SortKey>("price");
  const [product, setProduct]           = useState<{ name: string; image?: string | null } | null>(null);
  const [ecommerce, setEcommerce]       = useState<ShoppingResult[]>([]);
  const [qcPrices, setQcPrices]         = useState<ShoppingResult[]>([]);
  const [totalStores, setTotalStores]   = useState(0);
  const [isLoading, setIsLoading]       = useState(true);
  const [error, setError]               = useState<string | null>(null);

  const fetchPrices = useCallback(async (raw: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const payload = raw.startsWith("http") ? { url: raw } : { query: raw };
      const res  = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: CompareApiResponse = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setProduct(data.product ?? null);
        setEcommerce(data.ecommerce ?? []);
        setQcPrices(data.quickCommerce ?? []);
        setTotalStores(data.totalStores ?? 0);
      }
    } catch (err) {
      setError("Network error — please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (input) fetchPrices(input);
    else setIsLoading(false);
  }, [input, fetchPrices]);

  // ── Loading ─────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <PricingSkeleton message="Scanning stores for the best price…" />
        </div>
      </div>
    );
  }

  // ── No query ─────────────────────────────────────────────────────────────
  if (!input) {
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

  // ── No results ────────────────────────────────────────────────────────────
  if (ecommerce.length === 0 && qcPrices.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Compare", href: "/compare" }, { label: "No results" }]} />
          <SearchAgainBar />
          {error && (
            <div className="mb-4 px-4 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-sm text-yellow-500">
              ⚠ {error}
            </div>
          )}
          <div className="rounded-lg border border-border bg-card p-10 text-center">
            <p className="text-lg font-semibold mb-2">
              No prices found for &ldquo;{product?.name || input}&rdquo;
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Try a more specific search — e.g. &ldquo;iPhone 16 128GB&rdquo; instead of &ldquo;iPhone&rdquo;.
            </p>
            <a href="/" className="inline-block px-6 py-2.5 rounded-lg bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition-colors">
              Try another search
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── Results ───────────────────────────────────────────────────────────────
  const allPrices   = [...ecommerce, ...qcPrices];
  const lowestPrice = Math.min(...allPrices.map(s => s.price));
  const lowestStore = allPrices.find(s => s.price === lowestPrice);

  const sortedEcom = sortResults(ecommerce, sortBy);
  const sortedQC   = sortResults(qcPrices,  sortBy);
  const lowestEcom = sortedEcom.length ? Math.min(...sortedEcom.map(s => s.price)) : 0;
  const lowestQC   = sortedQC.length  ? Math.min(...sortedQC.map(s => s.price))  : 0;

  const breadcrumbName = (product?.name ?? input).slice(0, 50) + ((product?.name ?? input).length > 50 ? "…" : "");

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Search again bar */}
        <SearchAgainBar />

        {/* Breadcrumb */}
        <Breadcrumb items={[
          { label: "Home", href: "/" },
          { label: "Compare", href: "/compare" },
          { label: breadcrumbName },
        ]} />

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
            {(["price", "delivery"] as const).map(key => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all border ${
                  sortBy === key
                    ? "bg-accent text-accent-foreground border-accent"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                }`}
              >
                {key === "price" ? "Price ↑" : "Delivery"}
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
              {sortedEcom.map((item, i) => (
                <PriceCard
                  key={`${item.store}-${i}`}
                  item={item}
                  isLowest={item.price === lowestEcom}
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
              {sortedQC.map((item, i) => (
                <PriceCard
                  key={`${item.store}-qc-${i}`}
                  item={item}
                  isLowest={item.price === lowestQC}
                  index={i}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Price Alert */}
        {allPrices.length > 0 && (
          <AlertBox product={{ lowestPrice, name: product?.name ?? input }} />
        )}
      </div>
    </div>
  );
}
