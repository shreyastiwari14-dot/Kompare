import { NextRequest, NextResponse } from "next/server";

interface Price {
  store: string;
  price: number;
  currency: string;
  inStock: boolean;
  url?: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  image?: string;
  rating?: number;
  reviews?: number;
}

interface PriceHistory {
  date: string;
  price: number;
  store: string;
}

interface CompareResponse {
  success: boolean;
  product?: Product;
  prices?: Price[];
  history?: PriceHistory[];
  bestPrice?: Price;
  message?: string;
}

// Mock data for demonstration
const mockProducts: Record<string, { product: Product; prices: Price[]; history: PriceHistory[] }> = {
  iphone: {
    product: {
      id: "iphone-16",
      name: "iPhone 16",
      category: "smartphones",
      image: "https://images.unsplash.com/photo-1592286927505-1def25115558",
      rating: 4.8,
      reviews: 3452,
    },
    prices: [
      {
        store: "Flipkart",
        price: 62490,
        currency: "INR",
        inStock: true,
        url: "https://flipkart.com/iphone-16",
      },
      {
        store: "Amazon",
        price: 64999,
        currency: "INR",
        inStock: true,
        url: "https://amazon.in/iphone-16",
      },
      {
        store: "Croma",
        price: 69900,
        currency: "INR",
        inStock: true,
        url: "https://croma.com/iphone-16",
      },
      {
        store: "Apple Store",
        price: 79900,
        currency: "INR",
        inStock: false,
        url: "https://apple.com/iphone-16",
      },
    ],
    history: [
      { date: "2026-04-09", price: 62490, store: "Flipkart" },
      { date: "2026-04-08", price: 65999, store: "Flipkart" },
      { date: "2026-04-07", price: 68990, store: "Flipkart" },
      { date: "2026-04-06", price: 72000, store: "Flipkart" },
    ],
  },
  sony: {
    product: {
      id: "sony-wh1000xm5",
      name: "Sony WH-1000XM5 Wireless Headphones",
      category: "audio-wearables",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
      rating: 4.7,
      reviews: 2156,
    },
    prices: [
      {
        store: "Amazon",
        price: 19990,
        currency: "INR",
        inStock: true,
        url: "https://amazon.in/sony-wh1000xm5",
      },
      {
        store: "Flipkart",
        price: 21990,
        currency: "INR",
        inStock: true,
        url: "https://flipkart.com/sony-wh1000xm5",
      },
      {
        store: "Croma",
        price: 24990,
        currency: "INR",
        inStock: false,
        url: "https://croma.com/sony-wh1000xm5",
      },
    ],
    history: [
      { date: "2026-04-09", price: 19990, store: "Amazon" },
      { date: "2026-04-08", price: 22990, store: "Amazon" },
      { date: "2026-04-07", price: 25490, store: "Amazon" },
      { date: "2026-04-06", price: 30990, store: "Amazon" },
    ],
  },
  samsung: {
    product: {
      id: "samsung-s25ultra",
      name: "Samsung Galaxy S25 Ultra",
      category: "smartphones",
      image: "https://images.unsplash.com/photo-1511707267537-b85faf00021e",
      rating: 4.6,
      reviews: 1823,
    },
    prices: [
      {
        store: "Flipkart",
        price: 109999,
        currency: "INR",
        inStock: true,
        url: "https://flipkart.com/samsung-s25ultra",
      },
      {
        store: "Amazon",
        price: 112490,
        currency: "INR",
        inStock: true,
        url: "https://amazon.in/samsung-s25ultra",
      },
    ],
    history: [
      { date: "2026-04-09", price: 109999, store: "Flipkart" },
      { date: "2026-04-08", price: 119999, store: "Flipkart" },
      { date: "2026-04-07", price: 124999, store: "Flipkart" },
    ],
  },
};

export async function POST(request: NextRequest): Promise<NextResponse<CompareResponse>> {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Query parameter is required and must be a string",
        },
        { status: 400 }
      );
    }

    // Search for matching product in mock data
    const searchQuery = query.toLowerCase();
    let matchedProduct = null;

    for (const [key, data] of Object.entries(mockProducts)) {
      if (
        data.product.name.toLowerCase().includes(searchQuery) ||
        key.includes(searchQuery)
      ) {
        matchedProduct = data;
        break;
      }
    }

    if (!matchedProduct) {
      // Return a generic "no results" response
      return NextResponse.json(
        {
          success: false,
          message: `No products found matching "${query}". Try searching for "iPhone", "Sony headphones", or "Samsung Galaxy".`,
        },
        { status: 404 }
      );
    }

    // Find best price
    const bestPrice = matchedProduct.prices.reduce((best, current) =>
      current.price < best.price ? current : best
    );

    return NextResponse.json({
      success: true,
      product: matchedProduct.product,
      prices: matchedProduct.prices,
      history: matchedProduct.history,
      bestPrice,
    });
  } catch (error) {
    console.error("Compare API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
