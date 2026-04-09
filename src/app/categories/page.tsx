"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface Category {
  id: string;
  name: string;
  emoji: string;
  productCount: string;
  storeCount: number;
  description?: string;
}

const categories: Category[] = [
  {
    id: "smartphones",
    name: "Smartphones",
    emoji: "📱",
    productCount: "24K+",
    storeCount: 6,
    description: "Latest phones & flagship models",
  },
  {
    id: "laptops-tablets",
    name: "Laptops & Tablets",
    emoji: "💻",
    productCount: "8.5K+",
    storeCount: 5,
    description: "Laptops, tablets & 2-in-1s",
  },
  {
    id: "audio-wearables",
    name: "Audio & Wearables",
    emoji: "🎧",
    productCount: "12K+",
    storeCount: 7,
    description: "Earbuds, headphones & smartwatches",
  },
  {
    id: "tvs-monitors",
    name: "TVs & Monitors",
    emoji: "📺",
    productCount: "5.2K+",
    storeCount: 6,
    description: "4K TVs, smart displays & monitors",
  },
  {
    id: "home-appliances",
    name: "Home Appliances",
    emoji: "🏠",
    productCount: "3.2K+",
    storeCount: 8,
    description: "ACs, fridges, washing machines",
  },
  {
    id: "fashion",
    name: "Fashion",
    emoji: "👗",
    productCount: "50K+",
    storeCount: 4,
    description: "Myntra, Ajio, Amazon Fashion, Flipkart",
  },
  {
    id: "groceries",
    name: "Groceries",
    emoji: "🛒",
    productCount: "20K+",
    storeCount: 4,
    description: "Blinkit, Zepto, Instamart, BigBasket",
  },
  {
    id: "beauty",
    name: "Beauty & Personal Care",
    emoji: "💄",
    productCount: "15K+",
    storeCount: 3,
    description: "Nykaa, Amazon, Flipkart",
  },
  {
    id: "gaming",
    name: "Gaming",
    emoji: "🎮",
    productCount: "6K+",
    storeCount: 4,
    description: "Consoles, games & accessories",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
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

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center sm:text-left">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
            Shop by Category
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-black dark:text-white mb-4">
            All categories
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl">
            Compare prices across{" "}
            <span className="font-semibold">9 major categories</span> and save
            on every purchase. Real-time price updates from all top stores.
          </p>
        </div>

        {/* Category Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {categories.map((category) => (
            <motion.div key={category.id} variants={itemVariants}>
              <Link href={`/deals?category=${category.id}`}>
                <div className="group h-full cursor-pointer overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-950 dark:to-zinc-900 p-6 hover:shadow-lg dark:hover:shadow-2xl transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-700">
                  {/* Emoji and Title */}
                  <div className="mb-4">
                    <div className="text-5xl mb-4 inline-block group-hover:scale-110 transition-transform duration-300">
                      {category.emoji}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-black dark:text-white mb-2">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {category.description}
                      </p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-600 dark:text-zinc-400">
                        Products
                      </span>
                      <span className="font-semibold text-black dark:text-white">
                        {category.productCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-600 dark:text-zinc-400">
                        Stores
                      </span>
                      <span className="font-semibold text-black dark:text-white">
                        {category.storeCount}
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="mt-6 flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white transition-colors">
                    View deals
                    <svg
                      className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Section */}
        <div className="mt-16 rounded-2xl bg-gradient-to-r from-black to-zinc-900 dark:from-white dark:to-zinc-100 p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white dark:text-black mb-4">
            Can't find what you're looking for?
          </h2>
          <p className="text-white/80 dark:text-black/80 mb-6 max-w-2xl mx-auto">
            Use our search feature to compare prices across all products and
            stores instantly.
          </p>
          <Link
            href="/"
            className="inline-block px-8 py-3 bg-white dark:bg-black text-black dark:text-white rounded-lg font-semibold hover:shadow-lg transition-shadow"
          >
            Search Products
          </Link>
        </div>
      </div>
    </div>
  );
}
