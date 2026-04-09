"use client";

const stores = [
  "Amazon",
  "Flipkart",
  "Croma",
  "Reliance Digital",
  "Tata Cliq",
  "Vijay Sales",
  "Blinkit",
  "Zepto",
  "Swiggy Instamart",
  "BigBasket",
  "Myntra",
  "Ajio",
];

export default function Marquee() {
  return (
    <section className="w-full border-t border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-12 overflow-hidden">
      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .marquee-container {
          display: flex;
          animation: marquee 30s linear infinite;
        }

        .marquee-container:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="overflow-hidden">
        <div className="marquee-container">
          {[...stores, ...stores].map((store, idx) => (
            <div
              key={idx}
              className="flex items-center gap-8 px-8 whitespace-nowrap min-w-fit"
            >
              <span className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
                {store}
              </span>
              <span className="text-zinc-300 dark:text-zinc-600">•</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
