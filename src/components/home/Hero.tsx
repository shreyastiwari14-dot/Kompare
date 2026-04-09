"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Hero() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const looksLikeUrl = (s: string) =>
    s.startsWith('http://') ||
    s.startsWith('https://') ||
    /^(www\.)?(amazon|flipkart|croma|myntra|ajio|blinkit|zepto|reliancedigital|bigbasket|tatacliq|jiomart|nykaa|vijaysales)\.(in|com)/i.test(s.trim());

  const navigate = (value: string) => {
    const q = value.trim();
    if (!q) return;
    if (looksLikeUrl(q)) {
      const fullUrl = q.startsWith('http') ? q : `https://${q}`;
      router.push(`/compare?url=${encodeURIComponent(fullUrl)}`);
    } else {
      router.push(`/compare?q=${encodeURIComponent(q)}`);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(query);
  };

  return (
    <section className="relative w-full overflow-hidden px-4 py-32 sm:py-48">
      {/* Radial gradient glow background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] bg-gradient-to-r from-[#c8ff00]/20 to-purple-500/20 rounded-full blur-3xl dark:from-[#c8ff00]/10 dark:to-purple-500/10" />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 max-w-4xl mx-auto flex flex-col items-center gap-6 sm:gap-8"
      >
        {/* Badge */}
        <motion.div variants={item}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-black/50 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Live price tracking across 12+ stores
            </span>
          </div>
        </motion.div>

        {/* Main Heading */}
        <motion.div variants={item} className="text-center space-y-2">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight text-zinc-900 dark:text-white">
            Never{" "}
            <span className="relative inline-block">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c8ff00] to-[#a8df00] dark:from-[#c8ff00] dark:to-[#a8df00]">
                overpay
              </span>
              <svg
                className="absolute -bottom-2 left-0 w-full h-2 text-transparent"
                viewBox="0 0 200 20"
                preserveAspectRatio="none"
              >
                <path
                  d="M 0 10 Q 50 0 100 10 T 200 10"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  className="stroke-[#c8ff00]"
                />
              </svg>
            </span>{" "}
            again.
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          variants={item}
          className="text-center text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl"
        >
          Paste any product link. Instantly compare prices across Amazon, Flipkart, Blinkit, Zepto & more.
        </motion.p>

        {/* Search Bar */}
        <motion.form variants={item} onSubmit={handleSearch} className="w-full max-w-2xl">
          <div className="flex items-center gap-2 p-2 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg">
            <input
              type="text"
              placeholder="Paste a product link or search any product..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 px-6 py-4 bg-transparent text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-500 outline-none font-medium"
            />
            <button
              type="submit"
              className="px-8 py-4 rounded-full bg-[#c8ff00] text-zinc-900 font-bold hover:bg-[#b8ef00] transition-colors duration-200 whitespace-nowrap"
            >
              Kompare
            </button>
          </div>
        </motion.form>

        {/* Search Hints */}
        <motion.div variants={item} className="text-center">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">Try:</p>
          <div className="flex flex-wrap justify-center gap-3">
            {["iPhone 16", "Samsung S25", "Sony WH-1000XM5"].map((hint) => (
              <button
                key={hint}
                onClick={() => {
                  setQuery(hint);
                  navigate(hint);
                }}
                className="px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors duration-200 text-sm font-medium"
              >
                {hint}
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
