"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { Product, PriceHistoryPoint } from "@/lib/mockData";
import { formatPrice } from "@/lib/utils";

interface PriceChartProps {
  product: Product;
}

const STORE_COLORS: Record<string, string> = {
  Amazon: "#ea580c",
  Flipkart: "#1f40fb",
  Croma: "#22c55e",
  "Reliance Digital": "#ef4444",
  Blinkit: "#fbbf24",
  Zepto: "#06b6d4",
  "Swiggy Instamart": "#f97316",
};

const TIME_PERIODS = [
  { label: "1M", months: 1 },
  { label: "3M", months: 3 },
  { label: "6M", months: 6 },
  { label: "1Y", months: 12 },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  lowestEver: number | null;
}

function CustomTooltip({ active, payload, label, lowestEver }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg min-w-[160px]">
        <p className="text-xs text-muted-foreground mb-2">{label}</p>
        {payload.map((entry, index) => {
          const pctAboveLow =
            lowestEver && entry.value > lowestEver
              ? Math.round(((entry.value - lowestEver) / lowestEver) * 100)
              : null;
          return (
            <div key={index} className="flex items-center justify-between gap-3">
              <p style={{ color: entry.color }} className="text-sm font-semibold">
                {entry.name}: ₹{formatPrice(entry.value)}
              </p>
              {pctAboveLow !== null && (
                <span className="text-xs text-red-400">+{pctAboveLow}%</span>
              )}
            </div>
          );
        })}
      </div>
    );
  }
  return null;
}

export default function PriceChart({ product }: PriceChartProps) {
  const [timePeriod, setTimePeriod] = useState(3);

  const filteredData = product.priceHistory.slice(-timePeriod);

  const storeNames = Object.keys(STORE_COLORS).filter((storeName) =>
    product.priceHistory.some((point) => storeName in point)
  );

  // Compute the all-time lowest price across all stores and history points
  const lowestEver: number | null = (() => {
    const allPrices = product.priceHistory.flatMap((point) =>
      storeNames
        .map((s) => (point as Record<string, unknown>)[s] as number)
        .filter((v) => typeof v === "number" && v > 0)
    );
    return allPrices.length ? Math.min(...allPrices) : null;
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-lg border border-border bg-card p-6"
    >
      <div className="mb-6">
        <h3 className="text-lg font-bold">Price History</h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          Historical prices across all stores
        </p>

        {/* Time Period Tabs */}
        <div className="flex gap-2 mt-4">
          {TIME_PERIODS.map((period) => (
            <motion.button
              key={period.months}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTimePeriod(period.months)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                timePeriod === period.months
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {period.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-80 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={filteredData}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="month"
              stroke="var(--muted-foreground)"
              style={{ fontSize: "12px" }}
            />
            <YAxis
              stroke="var(--muted-foreground)"
              style={{ fontSize: "12px" }}
              tickFormatter={(value) => `₹${value / 1000}k`}
            />
            <Tooltip content={<CustomTooltip lowestEver={lowestEver} />} />
            <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="line" />

            {/* Lowest-ever reference line */}
            {lowestEver && (
              <ReferenceLine
                y={lowestEver}
                stroke="#22c55e"
                strokeDasharray="5 4"
                strokeWidth={1.5}
                label={{
                  value: `Lowest ₹${Math.round(lowestEver / 1000)}k`,
                  fill: "#22c55e",
                  fontSize: 11,
                  position: "insideTopRight",
                }}
              />
            )}

            {storeNames.map((storeName) => (
              <Line
                key={storeName}
                type="monotone"
                dataKey={storeName}
                stroke={STORE_COLORS[storeName]}
                strokeWidth={2}
                dot={{ fill: STORE_COLORS[storeName], r: 4 }}
                activeDot={{ r: 6 }}
                isAnimationActive={true}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Store color legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-4 border-t border-border">
        {storeNames.map((storeName) => (
          <div key={storeName} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: STORE_COLORS[storeName] }}
            />
            <span className="text-xs text-muted-foreground">{storeName}</span>
          </div>
        ))}
        {lowestEver && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-px border-t-2 border-dashed border-green-500 flex-shrink-0" />
            <span className="text-xs text-green-500 dark:text-green-400">Lowest ever</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
