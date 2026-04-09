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
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-xs text-muted-foreground mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm font-semibold">
            {entry.name}: ₹{formatPrice(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function PriceChart({ product }: PriceChartProps) {
  const [timePeriod, setTimePeriod] = useState(3); // 3M default

  // Filter data based on selected time period
  const filteredData = product.priceHistory.slice(-timePeriod);

  const storeNames = Object.keys(STORE_COLORS).filter((storeName) =>
    product.priceHistory.some((point) => storeName in point)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-lg border border-border bg-card p-6"
    >
      <div className="mb-6">
        <h3 className="text-lg font-bold mb-4">Price History</h3>

        {/* Time Period Tabs */}
        <div className="flex gap-2 mb-6">
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
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              iconType="line"
            />
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

      {/* Chart Legend Text */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-4 border-t border-border">
        {storeNames.map((storeName) => (
          <div key={storeName} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: STORE_COLORS[storeName] }}
            />
            <span className="text-xs text-muted-foreground">{storeName}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
