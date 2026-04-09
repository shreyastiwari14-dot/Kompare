"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check } from "lucide-react";
import { Product } from "@/lib/mockData";
import { formatPrice } from "@/lib/utils";

interface AlertBoxProps {
  product: Product;
}

export default function AlertBox({ product }: AlertBoxProps) {
  const [priceTarget, setPriceTarget] = useState(
    Math.floor(product.lowestPrice * 0.85)
  );
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSetAlert = () => {
    if (priceTarget > 0) {
      setIsSubmitted(true);
      setTimeout(() => setIsSubmitted(false), 3000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
      className="rounded-lg border border-border bg-gradient-to-br from-card to-card/50 p-6 mt-8"
    >
      <div className="flex flex-col md:flex-row md:items-end gap-6">
        {/* Left Section: Icon & Description */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-accent/10 border border-accent/30">
              <Bell className="w-5 h-5 text-accent" />
            </div>
            <h3 className="text-lg font-bold">Price Alert</h3>
          </div>
          <p className="text-sm text-muted-foreground max-w-sm">
            Get notified when the price drops below your target. We'll send you
            an instant alert via email.
          </p>
        </div>

        {/* Right Section: Input & Button */}
        <div className="flex flex-col sm:flex-row gap-3 md:flex-nowrap">
          <div className="flex-1 md:flex-initial">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                ₹
              </span>
              <input
                type="number"
                value={priceTarget}
                onChange={(e) => setPriceTarget(Number(e.target.value))}
                className="w-full pl-7 pr-3 py-2.5 rounded-lg bg-muted border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Target price"
                min="0"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Current: ₹{formatPrice(product.lowestPrice)}
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSetAlert}
            disabled={isSubmitted}
            className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              isSubmitted
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-accent text-accent-foreground hover:bg-accent/90"
            }`}
          >
            <AnimatePresence mode="wait">
              {isSubmitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Alert Set!</span>
                </motion.div>
              ) : (
                <motion.span
                  key="default"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  Set Alert
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* Success Toast */}
      <AnimatePresence>
        {isSubmitted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center gap-3"
          >
            <div className="w-5 h-5 rounded-full bg-green-500/30 flex items-center justify-center">
              <Check className="w-3 h-3 text-green-400" />
            </div>
            <p className="text-sm text-green-400 font-medium">
              Price alert set! We'll notify you when price drops below ₹{formatPrice(priceTarget)}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
