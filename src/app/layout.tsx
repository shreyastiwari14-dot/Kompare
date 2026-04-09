import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "Kompare - Price Comparison Platform",
  description:
    "Compare prices across India's top e-commerce and quick commerce platforms. Find the best deals on products from Amazon, Flipkart, Croma, and more.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className="h-full antialiased">
        <ThemeProvider>
          <ToastProvider>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <div className="h-16" />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
