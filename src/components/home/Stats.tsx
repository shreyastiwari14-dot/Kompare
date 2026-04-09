"use client";

import { useEffect, useState } from "react";
import { useInView } from "framer-motion";
import { useRef } from "react";

interface StatItemProps {
  value: number;
  label: string;
  suffix?: string;
}

function StatItem({ value, label, suffix = "" }: StatItemProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    let animationFrameId: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / 1500, 1);
      setDisplayValue(Math.floor(value * progress));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isInView, value]);

  return (
    <div ref={ref} className="flex flex-col gap-2">
      <div className="font-mono text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-[#c8ff00]">
        {displayValue.toLocaleString()}
        {suffix}
      </div>
      <p className="text-lg text-zinc-600 dark:text-zinc-400">{label}</p>
    </div>
  );
}

const stats = [
  { value: 12, label: "Stores tracked", suffix: "+" },
  { value: 2400000, label: "Products", suffix: "M" },
  { value: 847, label: "Users saved today", suffix: "+" },
  { value: 23, label: "Avg saved", suffix: "%" },
];

export default function Stats() {
  return (
    <section className="w-full py-20 px-4 sm:py-32">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 sm:gap-8">
          {stats.map((stat) => (
            <StatItem key={stat.label} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
}
