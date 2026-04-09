"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const categories = [
  { name: "Smartphones", emoji: "📱", count: "2,847" },
  { name: "Laptops", emoji: "💻", count: "1,542" },
  { name: "Audio", emoji: "🎧", count: "892" },
  { name: "Quick Commerce", emoji: "🛍️", count: "5,234" },
  { name: "Fashion", emoji: "👕", count: "3,156" },
  { name: "Appliances", emoji: "🏠", count: "1,823" },
];

export default function CategoriesPreview() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="w-full py-20 px-4 sm:py-32">
      <div className="max-w-6xl mx-auto">
        {/* Section Label */}
        <div className="mb-12 sm:mb-16">
          <span className="font-mono text-sm font-bold text-zinc-600 dark:text-zinc-400">
            002 / Categories
          </span>
        </div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-zinc-900 dark:text-white mb-16 sm:mb-20"
        >
          Compare anything.
        </motion.h2>

        {/* Categories Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          animate={isInView ? "show" : "hidden"}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {categories.map((category, idx) => (
            <motion.div key={idx} variants={item}>
              <Link
                href="/categories"
                className="flex flex-col gap-4 p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-lg dark:hover:shadow-lg hover:shadow-zinc-300/20 dark:hover:shadow-zinc-700/30 transition-all duration-300 group hover:-translate-y-0.5"
              >
                <div className="text-5xl group-hover:scale-110 transition-transform duration-300">
                  {category.emoji}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                    {category.name}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {category.count} products
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* View All CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 text-center"
        >
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-zinc-900 dark:bg-[#c8ff00] text-white dark:text-zinc-900 font-bold hover:bg-zinc-800 dark:hover:bg-[#b8ef00] transition-colors duration-200"
          >
            Explore all categories
            <span>→</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
