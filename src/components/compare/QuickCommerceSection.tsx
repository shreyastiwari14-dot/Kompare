"use client";

import { motion } from "framer-motion";
import { Product } from "@/lib/mockData";
import PriceCard from "./PriceCard";

interface QuickCommerceSectionProps {
  product: Product;
}

export default function QuickCommerceSection({ product }: QuickCommerceSectionProps) {
  const quickCommerceStores = product.storePrices.filter(
    (store) => store.isQuickCommerce
  );

  if (quickCommerceStores.length === 0) {
    return null;
  }

  const lowestQCPrice = Math.min(...quickCommerceStores.map((s) => s.price));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="mt-12 pt-8 border-t border-border"
    >
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-6"
      >
        <h2 className="flex items-center gap-2 text-xl font-bold mb-2">
          <span className="text-2xl">⚡</span>
          <span>Quick Commerce — Delivered in minutes</span>
        </h2>
        <p className="text-sm text-muted-foreground">
          Get your product faster with quick delivery services
        </p>
      </motion.div>

      {/* Price Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickCommerceStores.map((store, index) => (
          <PriceCard
            key={store.id}
            store={store}
            isLowest={store.price === lowestQCPrice}
            index={index}
          />
        ))}
      </div>
    </motion.div>
  );
}
