"use client";

import { motion } from "framer-motion";
import { StorePrice } from "@/lib/mockData";
import { formatPrice } from "@/lib/utils";

interface PriceCardProps {
  store: StorePrice;
  isLowest: boolean;
  index: number;
}

/** Convert "by 11 Apr" style dates → "in 2 days · Apr 11". Pass-through everything else. */
function formatDeliveryInfo(info: string): string {
  const byDateMatch = info.match(/by\s+(\d+)\s+(\w{3})/i);
  if (byDateMatch) {
    const day = parseInt(byDateMatch[1]);
    const mon = byDateMatch[2];
    const months: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
    };
    const targetMonth = months[mon.toLowerCase()];
    if (targetMonth !== undefined) {
      const now = new Date();
      const target = new Date(now.getFullYear(), targetMonth, day);
      const diffDays = Math.round((target.getTime() - now.getTime()) / 86_400_000);
      const label = diffDays === 0
        ? 'today'
        : diffDays === 1
          ? `tomorrow · ${mon} ${day}`
          : diffDays > 0 && diffDays <= 14
            ? `in ${diffDays} days · ${mon} ${day}`
            : null;
      if (label) return info.replace(/by\s+\d+\s+\w{3}/i, label);
    }
  }
  return info;
}

export default function PriceCard({ store, isLowest, index }: PriceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
      whileHover={{ translateX: 4 }}
      className={`relative rounded-lg border p-5 transition-all ${
        isLowest
          ? "border-green-500/50 bg-gradient-to-br from-green-500/5 to-transparent"
          : "border-border bg-card"
      }`}
    >
      {/* Left accent stripe for lowest price */}
      {isLowest && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-400 to-green-600 rounded-l-lg" />
      )}

      <div className="flex flex-col gap-3">
        {/* Store header: logo + name + delivery */}
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-lg bg-gradient-to-br ${store.logoColor} flex items-center justify-center text-xs font-bold text-white/90 flex-shrink-0`}
          >
            {store.logoInitials}
          </div>
          <div className="flex flex-col min-w-0">
            <h3 className="font-semibold text-foreground truncate">{store.storeName}</h3>
            <p className="text-xs text-muted-foreground truncate">
              {formatDeliveryInfo(store.deliveryInfo)}
            </p>
          </div>
        </div>

        {/* Fixed 24px discount badge slot — always occupies space */}
        <div className="h-6 flex items-center">
          {store.discount ? (
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {store.discount}% OFF
            </span>
          ) : null}
        </div>

        {/* Price row */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-3">
            <span
              className={`text-2xl font-bold font-mono tabular-nums ${
                isLowest ? "text-green-400" : "text-foreground"
              }`}
            >
              ₹{formatPrice(store.price)}
            </span>
            {store.originalPrice && (
              <span className="text-sm text-muted-foreground line-through tabular-nums">
                ₹{formatPrice(store.originalPrice)}
              </span>
            )}
          </div>

          {/* Fixed 24px lowest-price badge slot */}
          <div className="h-6 flex items-center">
            {isLowest ? (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-500/20 border border-green-500/30 text-xs font-semibold text-green-500 dark:text-green-400"
              >
                ✓ Lowest Price
              </motion.span>
            ) : null}
          </div>
        </div>

        {/* Quick Commerce delivery badge */}
        {store.isQuickCommerce && store.deliveryTime && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 w-fit">
            <span className="text-base">⚡</span>
            <span className="text-xs font-semibold text-orange-500 dark:text-orange-400">
              {store.deliveryTime}
            </span>
          </div>
        )}

        {/* Buy Button */}
        <div className="mt-1 flex">
          {isLowest ? (
            <a
              href={store.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full px-4 py-2.5 rounded-lg bg-accent text-accent-foreground font-semibold text-sm transition-all hover:bg-accent/90 active:scale-95 flex items-center justify-center gap-2 group"
            >
              <span>Buy on {store.storeName}</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </a>
          ) : (
            <a
              href={store.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto px-4 py-2 rounded-lg border border-border text-foreground/75 font-medium text-sm transition-all hover:bg-muted active:scale-95 flex items-center gap-1.5 group"
            >
              <span>Buy on {store.storeName}</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
