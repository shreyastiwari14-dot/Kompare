"use client";

import { Suspense } from "react";
import ComparePageContent from "@/components/compare/ComparePageContent";

function PricingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex gap-8">
        <div className="w-40 h-40 rounded-2xl bg-muted flex-shrink-0" />
        <div className="flex-1 space-y-4">
          <div className="h-6 w-24 bg-muted rounded" />
          <div className="h-8 w-3/4 bg-muted rounded" />
          <div className="h-20 w-2/3 bg-muted rounded-lg mt-6" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="rounded-lg border border-border bg-card p-5 h-40 bg-muted" />
        ))}
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <PricingSkeleton />
          </div>
        </div>
      }
    >
      <ComparePageContent />
    </Suspense>
  );
}
