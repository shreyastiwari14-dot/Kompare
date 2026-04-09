"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const steps = [
  {
    number: "01",
    title: "Paste or search",
    description: "Drop any product link or search for products you want to compare",
    emoji: "📎",
  },
  {
    number: "02",
    title: "Instant comparison",
    description: "We scan 12+ stores and show you the best prices instantly",
    emoji: "⚡",
  },
  {
    number: "03",
    title: "Set alerts & save",
    description: "Get notified when prices drop and save your favorite products",
    emoji: "🔔",
  },
];

export default function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="w-full py-20 px-4 sm:py-32">
      <div className="max-w-6xl mx-auto">
        {/* Section Label */}
        <div className="mb-12 sm:mb-16">
          <span className="font-mono text-sm font-bold text-zinc-600 dark:text-zinc-400">
            001 / How it works
          </span>
        </div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-zinc-900 dark:text-white mb-16 sm:mb-20"
        >
          Three steps to the best price.
        </motion.h2>

        {/* Cards Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          animate={isInView ? "show" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              variants={item}
              className="flex flex-col gap-6 p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:shadow-lg dark:hover:shadow-lg hover:shadow-zinc-300/20 dark:hover:shadow-zinc-700/20 transition-shadow duration-300"
            >
              <div className="text-4xl">{step.emoji}</div>

              <div>
                <div className="font-mono text-sm font-bold text-zinc-600 dark:text-zinc-400 mb-2">
                  {step.number}
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
