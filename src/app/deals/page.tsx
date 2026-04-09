"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, ReactNode } from "react";
import { motion } from "framer-motion";
import DealCard from "@/components/deals/DealCard";
import Breadcrumb from "@/components/ui/Breadcrumb";

interface Deal {
  id: string;
  emoji: string;
  name: string;
  currentPrice: number;
  originalPrice: number;
  discount: number;
  store: string;
  storeCount: number;
  category: string;
}

const allDeals: Deal[] = [
  {
    id: "1",
    emoji: "📱",
    name: "iPhone 16",
    currentPrice: 62490,
    originalPrice: 79900,
    discount: 22,
    store: "Flipkart",
    storeCount: 5,
    category: "smartphones",
  },
  {
    id: "2",
    emoji: "🎧",
    name: "Sony WH-1000XM5 Headphones",
    currentPrice: 19990,
    originalPrice: 30990,
    discount: 35,
    store: "Amazon",
    storeCount: 6,
    category: "audio-wearables",
  },
  {
    id: "3",
    emoji: "📱",
    name: "Samsung Galaxy S25 Ultra",
    currentPrice: 109999,
    originalPrice: 134999,
    discount: 18,
    store: "Flipkart",
    storeCount: 5,
    category: "smartphones",
  },
  {
    id: "4",
    emoji: "💻",
    name: "MacBook Air M3",
    currentPrice: 89990,
    originalPrice: 114900,
    discount: 28,
    store: "Flipkart",
    storeCount: 4,
    category: "laptops-tablets",
  },
  {
    id: "5",
    emoji: "🛒",
    name: "Amul Taaza Milk 1L",
    currentPrice: 56,
    originalPrice: 78,
    discount: 28,
    store: "BigBasket",
    storeCount: 4,
    category: "groceries",
  },
  {
    id: "6",
    emoji: "👟",
    name: "Nike Air Max 270",
    currentPrice: 6295,
    originalPrice: 10795,
    discount: 42,
    store: "Myntra",
    storeCount: 3,
    category: "fashion",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
};

function DealsPageContent() {
  const searchParams = useSearchParams();
  const categoryFilter = searchParams.get("category");

  const filteredDeals = categoryFilter
    ? allDeals.filter((deal) => deal.category === categoryFilter)
    : allDeals;

  const getCategoryName = (id: string): string => {
    const names: Record<string, string> = {
      smartphones: "Smartphones",
      "laptops-tablets": "Laptops & Tablets",
      "audio-wearables": "Audio & Wearables",
      "tvs-monitors": "TVs & Monitors",
      "home-appliances": "Home Appliances",
      fashion: "Fashion",
      groceries: "Groceries",
      beauty: "Beauty & Personal Care",
      gaming: "Gaming",
    };
    return names[id] || id;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
      <div className="max-w-6xl mx-auto">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Deals" },
          ]}
          className="text-zinc-500 dark:text-zinc-400"
        />
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
            Hot Deals
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-black dark:text-white mb-3">
            Today's best drops
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Real-time price drops detected by Kompare
          </p>

          {categoryFilter && (
            <div className="mt-6 flex items-center gap-3">
              <div className="inline-block px-4 py-2 bg-zinc-100 dark:bg-zinc-900 rounded-full">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Category:{" "}
                  <span className="font-semibold">
                    {getCategoryName(categoryFilter)}
                  </span>
                </p>
              </div>
              <a
                href="/deals"
                className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors underline"
              >
                View all deals
              </a>
            </div>
          )}
        </motion.div>

        {/* Deals Grid */}
        {filteredDeals.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredDeals.map((deal) => (
              <motion.div key={deal.id} variants={itemVariants}>
                <DealCard
                  emoji={deal.emoji}
                  name={deal.name}
                  currentPrice={deal.currentPrice}
                  originalPrice={deal.originalPrice}
                  discount={deal.discount}
                  store={deal.store}
                  storeCount={deal.storeCount}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-20"
          >
            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-4">
              No deals found for this category
            </p>
            <a
              href="/deals"
              className="text-sm font-medium text-black dark:text-white hover:underline"
            >
              View all deals
            </a>
          </motion.div>
        )}

        {/* Stats Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-gradient-to-r from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-950 p-8 sm:p-12"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-black dark:text-white">
                {filteredDeals.length}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                Active Deals Today
              </p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-black dark:text-white">
                250+
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                Stores Monitored
              </p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-black dark:text-white">
                ₹{filteredDeals.length > 0 ? "2.5L+" : "0"}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                Saved Today
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function DealsPageFallback() {
  return (
    <div className="min-h-screen bg-white dark:bg-black px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="animate-pulse space-y-8">
          <div className="h-12 w-64 bg-zinc-200 dark:bg-zinc-800 rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DealsPage() {
  return (
    <Suspense fallback={<DealsPageFallback />}>
      <DealsPageContent />
    </Suspense>
  );
}
