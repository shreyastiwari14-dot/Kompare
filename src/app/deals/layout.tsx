import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Today's Best Deals | Kompare",
  description:
    "Real-time price drops detected by Kompare across India's top stores",
};

export default function DealsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
