"use client";

import { motion } from "framer-motion";
import type { ShoppingResult } from "@/lib/providers/googleShopping";

interface PriceCardProps {
  item: ShoppingResult;
  isLowest: boolean;
  index: number;
}

const STORE_COLORS: Record<string, string> = {
  amazon:     'from-orange-400 to-orange-600',
  flipkart:   'from-blue-400 to-blue-600',
  croma:      'from-green-400 to-green-600',
  reliance:   'from-red-500 to-red-700',
  tatacliq:   'from-purple-400 to-purple-600',
  vijaysales: 'from-blue-600 to-blue-800',
  myntra:     'from-pink-400 to-pink-600',
  ajio:       'from-indigo-400 to-indigo-600',
  nykaa:      'from-rose-400 to-rose-600',
  samsung:    'from-blue-700 to-indigo-700',
  apple:      'from-gray-500 to-gray-700',
  jiomart:    'from-sky-400 to-sky-600',
  blinkit:    'from-yellow-300 to-yellow-500',
  zepto:      'from-cyan-400 to-cyan-600',
  instamart:  'from-orange-500 to-red-500',
  bigbasket:  'from-green-500 to-green-700',
};

const QC_STORES = new Set(['blinkit', 'zepto', 'instamart', 'bigbasket']);

function getLogoInitials(storeName: string): string {
  return storeName
    .split(/\s+/)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatPrice(n: number): string {
  return n.toLocaleString('en-IN');
}

export default function PriceCard({ item, isLowest, index }: PriceCardProps) {
  const logoColor = STORE_COLORS[item.store] ?? 'from-gray-400 to-gray-600';
  const initials = getLogoInitials(item.storeName);
  const isQC = QC_STORES.has(item.store);

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
        {/* Store header */}
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-lg bg-gradient-to-br ${logoColor} flex items-center justify-center text-xs font-bold text-white/90 flex-shrink-0`}
          >
            {initials}
          </div>
          <div className="flex flex-col min-w-0">
            <h3 className="font-semibold text-foreground truncate">{item.storeName}</h3>
            <p className="text-xs text-muted-foreground truncate">
              {item.delivery ?? (isQC ? 'Fast delivery' : 'Check store for delivery')}
            </p>
          </div>
        </div>

        {/* Spacer for discount badge slot */}
        <div className="h-6 flex items-center">
          {/* No discount data from SerpAPI in basic results */}
        </div>

        {/* Price row */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-3">
            <span
              className={`text-2xl font-bold font-mono tabular-nums ${
                isLowest ? "text-green-400" : "text-foreground"
              }`}
            >
              ₹{formatPrice(item.price)}
            </span>
          </div>

          {/* Lowest price badge slot */}
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

        {/* Quick commerce delivery badge */}
        {isQC && item.delivery && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 w-fit">
            <span className="text-base">⚡</span>
            <span className="text-xs font-semibold text-orange-500 dark:text-orange-400">
              {item.delivery}
            </span>
          </div>
        )}

        {/* Rating */}
        {item.rating && (
          <div className="text-xs text-muted-foreground">
            ★ {item.rating.toFixed(1)}{item.reviews ? ` · ${item.reviews.toLocaleString('en-IN')} reviews` : ''}
          </div>
        )}

        {/* Buy Button */}
        <div className="mt-1 flex">
          {isLowest ? (
            <a
              href={item.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full px-4 py-2.5 rounded-lg bg-accent text-accent-foreground font-semibold text-sm transition-all hover:bg-accent/90 active:scale-95 flex items-center justify-center gap-2 group"
            >
              <span>Buy on {item.storeName}</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </a>
          ) : (
            <a
              href={item.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto px-4 py-2 rounded-lg border border-border text-foreground/75 font-medium text-sm transition-all hover:bg-muted active:scale-95 flex items-center gap-1.5 group"
            >
              <span>Buy on {item.storeName}</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
