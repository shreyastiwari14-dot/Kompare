"use client";

import { motion } from "framer-motion";
import { Product } from "@/lib/mockData";
import { formatPrice } from "@/lib/utils";

interface ProductHeaderProps {
  product: Product;
}

export default function ProductHeader({ product }: ProductHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mb-10"
    >
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Product Image/Emoji */}
        <div className="flex-shrink-0">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-gradient-to-br from-muted to-muted/50 border border-border flex items-center justify-center"
          >
            <span className="text-6xl md:text-8xl">{product.emoji}</span>
          </motion.div>
        </div>

        {/* Product Info */}
        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-4"
          >
            {/* Category */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/30">
              <span className="text-xs font-semibold text-accent">
                {product.category}
              </span>
            </div>

            {/* Product Name */}
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              {product.name}
            </h1>

            {/* Variant Tags */}
            {product.variant && (
              <div className="flex flex-wrap gap-2">
                {product.variant.split(",").map((variant, idx) => (
                  <motion.span
                    key={idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.15 + idx * 0.05 }}
                    className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-sm font-medium border border-border"
                  >
                    {variant.trim()}
                  </motion.span>
                ))}
              </div>
            )}

            {/* Savings Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="inline-block mt-4 px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/30"
            >
              <p className="text-sm text-muted-foreground mb-1">Potential Savings</p>
              <p className="text-xl font-bold text-green-400">
                Up to ₹{formatPrice(product.maxSavings)} across stores
              </p>
            </motion.div>

            {/* Price Range */}
            <div className="flex items-baseline gap-3 pt-2">
              <span className="text-sm text-muted-foreground">Starting from:</span>
              <span className="text-2xl md:text-3xl font-bold font-mono text-accent">
                ₹{formatPrice(product.lowestPrice)}
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
