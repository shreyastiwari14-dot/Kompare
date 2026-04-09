"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Product, getProductBySearchQuery } from "@/lib/mockData";
import ProductHeader from "@/components/compare/ProductHeader";
import PriceCard from "@/components/compare/PriceCard";
import QuickCommerceSection from "@/components/compare/QuickCommerceSection";
import PriceChart from "@/components/compare/PriceChart";
import AlertBox from "@/components/compare/AlertBox";

// Loading Skeleton Component
function PricingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="animate-pulse flex gap-8">
        <div className="w-40 h-40 rounded-2xl bg-muted" />
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

      {/* Price Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-card p-5 space-y-4 animate-pulse"
          >
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

      {/* Chart Skeleton */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4 animate-pulse">
        <div className="h-6 w-32 bg-muted rounded" />
        <div className="h-80 bg-muted rounded-lg" />
      </div>
    </div>
  );
}

export default function ComparePageContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call with 1.5s delay
    const timer = setTimeout(() => {
      const foundProduct = getProductBySearchQuery(q);
      setProduct(foundProduct);
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [q]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <PricingSkeleton />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Product not found</h1>
          <p className="text-muted-foreground mb-6">
            We couldn't find the product you're looking for
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

  // Separate quick commerce and regular stores
  const regularStores = product.storePrices.filter(
    (store) => !store.isQuickCommerce
  );
  const lowestRegularPrice = Math.min(...regularStores.map((s) => s.price));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Product Header */}
        <ProductHeader product={product} />

        {/* Regular E-commerce Section */}
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

          {/* Price Cards Grid */}
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

        {/* Quick Commerce Section */}
        <QuickCommerceSection product={product} />

        {/* Price Chart */}
        <div className="mt-12">
          <PriceChart product={product} />
        </div>

        {/* Price Alert Box */}
        <AlertBox product={product} />
      </div>
    </div>
  );
}
