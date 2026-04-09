"use client";

import { motion } from "framer-motion";
import { StorePrice } from "@/lib/mockData";
import { formatPrice } from "@/lib/utils";

interface PriceCardProps {
  store: StorePrice;
  isLowest: boolean;
  index: number;
}

export default function PriceCard({ store, isLowest, index }: PriceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: "easeOut",
      }}
      whileHover={{ translateX: 4 }}
      className={`relative rounded-lg border p-5 transition-all ${
        isLowest
          ? "border-green-500/50 bg-gradient-to-br from-green-500/5 to-transparent"
          : "border-border bg-card"
      }`}
    >
      {/* Left border accent for lowest price */}
      {isLowest && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-400 to-green-600 rounded-l-lg" />
      )}

      <div className="flex flex-col gap-4">
        {/* Store Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Store Logo */}
            <div
              className={`w-12 h-12 rounded-lg bg-gradient-to-br ${store.logoColor} flex items-center justify-center text-xs font-bold text-white/90`}
            >
              {store.logoInitials}
            </div>
            <div className="flex flex-col">
              <h3 className="font-semibold text-foreground">{store.storeName}</h3>
              <p className="text-xs text-muted-foreground">{store.deliveryInfo}</p>
            </div>
          </div>

          {/* Discount Badge */}
          {store.discount && (
            <div className="px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold">
              {store.discount}% OFF
            </div>
          )}
        </div>

        {/* Price Section */}
        <div className="space-y-1.5">
          <div className="flex items-baseline gap-3">
            <span
              className={`text-2xl font-bold font-mono ${
                isLowest ? "text-green-400" : "text-accent"
              }`}
            >
              ₹{formatPrice(store.price)}
            </span>
            {store.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                ₹{formatPrice(store.originalPrice)}
              </span>
            )}
          </div>

          {/* Lowest Price Tag */}
          {isLowest && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/20 border border-green-500/30"
            >
              <span className="text-xs font-semibold text-green-400">
                ✓ Lowest Price
              </span>
            </motion.div>
          )}
        </div>

        {/* Quick Commerce Badge */}
        {store.isQuickCommerce && store.deliveryTime && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 w-fit">
            <span className="text-lg">⚡</span>
            <span className="text-xs font-semibold text-orange-400">
              {store.deliveryTime}
            </span>
          </div>
        )}

        {/* Buy Button */}
        <button className="mt-2 w-full px-4 py-2.5 rounded-lg bg-accent text-accent-foreground font-semibold text-sm transition-all hover:bg-accent/90 active:scale-95 flex items-center justify-center gap-2 group">
          <span>Buy</span>
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </button>
      </div>
    </motion.div>
  );
}
