"use client";

import { motion } from "framer-motion";
import { useToast } from "@/components/ui/Toast";

interface DealCardProps {
  emoji: string;
  name: string;
  currentPrice: number;
  originalPrice: number;
  discount: number;
  store: string;
  storeCount?: number;
}

export default function DealCard({
  emoji,
  name,
  currentPrice,
  originalPrice,
  discount,
  store,
  storeCount,
}: DealCardProps) {
  const { addToast } = useToast();

  const handleShare = async () => {
    const shareText = `🔥 Deal Alert: ${name} at ₹${currentPrice} (was ₹${originalPrice}) -${discount}% on ${store} | Kompare`;

    try {
      await navigator.clipboard.writeText(shareText);
      addToast("Link copied! Share on WhatsApp");
    } catch (err) {
      console.error("Failed to copy:", err);
      addToast("Failed to copy link");
    }
  };

  return (
    <motion.div
      whileHover={{ translateY: -2 }}
      transition={{ duration: 0.2 }}
      className="group relative overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 hover:shadow-lg dark:hover:shadow-xl transition-shadow"
    >
      {/* Discount Badge */}
      <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
        -{discount}%
      </div>

      {/* Emoji and Title */}
      <div className="mb-4">
        <div className="text-4xl mb-3">{emoji}</div>
        <h3 className="text-lg font-semibold text-black dark:text-white line-clamp-2">
          {name}
        </h3>
      </div>

      {/* Price Section */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl font-bold text-black dark:text-white">
            ₹{currentPrice.toLocaleString()}
          </span>
          <span className="text-sm line-through text-zinc-500">
            ₹{originalPrice.toLocaleString()}
          </span>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Save ₹{(originalPrice - currentPrice).toLocaleString()}
        </p>
      </div>

      {/* Store Info */}
      <div className="mb-5 pb-5 border-b border-zinc-200 dark:border-zinc-800">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {store}
        </p>
        {storeCount && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Available on {storeCount} stores
          </p>
        )}
      </div>

      {/* Share Button */}
      <button
        onClick={handleShare}
        className="w-full px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium text-sm hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
      >
        Share Deal
      </button>
    </motion.div>
  );
}
