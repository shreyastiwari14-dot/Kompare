import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Categories | Kompare",
  description: "Browse all product categories and find the best prices",
};

export default function CategoriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
