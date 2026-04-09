export interface StorePrice {
  id: string;
  storeName: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  deliveryInfo: string;
  logoInitials: string;
  logoColor: string;
  isQuickCommerce?: boolean;
  deliveryTime?: string;
  url?: string;   // direct link to this product on the store
}

export interface PriceHistoryPoint {
  month: string;
  [key: string]: string | number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  emoji: string;
  image?: string;
  variant?: string;
  storePrices: StorePrice[];
  priceHistory: PriceHistoryPoint[];
  lowestPrice: number;
  maxSavings: number;
}

export const mockProducts: Record<string, Product> = {
  "iphone-16-128gb": {
    id: "iphone-16-128gb",
    name: "iPhone 16",
    category: "Smartphones",
    emoji: "📱",
    variant: "128GB, Black",
    storePrices: [
      {
        id: "amazon-iphone",
        storeName: "Amazon",
        price: 64999,
        originalPrice: 79999,
        discount: 19,
        deliveryInfo: "Free delivery by 11 Apr",
        logoInitials: "AM",
        logoColor: "from-orange-400 to-orange-600",
        isQuickCommerce: false,
      },
      {
        id: "flipkart-iphone",
        storeName: "Flipkart",
        price: 62490,
        originalPrice: 79999,
        discount: 22,
        deliveryInfo: "Free delivery by 10 Apr",
        logoInitials: "FK",
        logoColor: "from-blue-400 to-blue-600",
        isQuickCommerce: false,
      },
      {
        id: "croma-iphone",
        storeName: "Croma",
        price: 66990,
        originalPrice: 79999,
        discount: 16,
        deliveryInfo: "Free delivery by 12 Apr",
        logoInitials: "CR",
        logoColor: "from-green-400 to-green-600",
        isQuickCommerce: false,
      },
      {
        id: "reliance-iphone",
        storeName: "Reliance Digital",
        price: 67490,
        originalPrice: 79999,
        discount: 16,
        deliveryInfo: "Free delivery by 13 Apr",
        logoInitials: "RD",
        logoColor: "from-red-400 to-red-600",
        isQuickCommerce: false,
      },
      {
        id: "tata-iphone",
        storeName: "Tata Cliq",
        price: 69999,
        originalPrice: 79999,
        discount: 13,
        deliveryInfo: "Free delivery by 14 Apr",
        logoInitials: "TC",
        logoColor: "from-purple-400 to-purple-600",
        isQuickCommerce: false,
      },
      {
        id: "blinkit-iphone",
        storeName: "Blinkit",
        price: 69999,
        originalPrice: 79999,
        discount: 13,
        deliveryInfo: "Delivered in 10 min",
        logoInitials: "BK",
        logoColor: "from-yellow-300 to-yellow-500",
        isQuickCommerce: true,
        deliveryTime: "10 min",
      },
      {
        id: "zepto-iphone",
        storeName: "Zepto",
        price: 70999,
        originalPrice: 79999,
        discount: 11,
        deliveryInfo: "Delivered in 12 min",
        logoInitials: "ZP",
        logoColor: "from-cyan-400 to-cyan-600",
        isQuickCommerce: true,
        deliveryTime: "12 min",
      },
    ],
    priceHistory: [
      {
        month: "Jun",
        Amazon: 79999,
        Flipkart: 79999,
        Croma: 79999,
        "Reliance Digital": 79999,
      },
      {
        month: "Jul",
        Amazon: 77999,
        Flipkart: 77999,
        Croma: 78999,
        "Reliance Digital": 78999,
      },
      {
        month: "Aug",
        Amazon: 71999,
        Flipkart: 71999,
        Croma: 72999,
        "Reliance Digital": 73999,
      },
      {
        month: "Sep",
        Amazon: 68999,
        Flipkart: 67490,
        Croma: 69999,
        "Reliance Digital": 70999,
      },
      {
        month: "Oct",
        Amazon: 67999,
        Flipkart: 66999,
        Croma: 68999,
        "Reliance Digital": 69999,
      },
      {
        month: "Nov",
        Amazon: 66999,
        Flipkart: 65990,
        Croma: 67999,
        "Reliance Digital": 68999,
      },
      {
        month: "Dec",
        Amazon: 65999,
        Flipkart: 63990,
        Croma: 66999,
        "Reliance Digital": 67999,
      },
      {
        month: "Jan",
        Amazon: 64999,
        Flipkart: 62490,
        Croma: 66990,
        "Reliance Digital": 67490,
      },
    ],
    lowestPrice: 62490,
    maxSavings: 17509,
  },

  "sony-wh1000xm5": {
    id: "sony-wh1000xm5",
    name: "Sony WH-1000XM5",
    category: "Headphones",
    emoji: "🎧",
    variant: "Black",
    storePrices: [
      {
        id: "amazon-sony",
        storeName: "Amazon",
        price: 19990,
        originalPrice: 29990,
        discount: 33,
        deliveryInfo: "Free delivery by 11 Apr",
        logoInitials: "AM",
        logoColor: "from-orange-400 to-orange-600",
        isQuickCommerce: false,
      },
      {
        id: "flipkart-sony",
        storeName: "Flipkart",
        price: 21490,
        originalPrice: 29990,
        discount: 28,
        deliveryInfo: "Free delivery by 10 Apr",
        logoInitials: "FK",
        logoColor: "from-blue-400 to-blue-600",
        isQuickCommerce: false,
      },
      {
        id: "croma-sony",
        storeName: "Croma",
        price: 22990,
        originalPrice: 29990,
        discount: 23,
        deliveryInfo: "Free delivery by 12 Apr",
        logoInitials: "CR",
        logoColor: "from-green-400 to-green-600",
        isQuickCommerce: false,
      },
    ],
    priceHistory: [
      { month: "Jun", Amazon: 29990, Flipkart: 29990, Croma: 29990 },
      { month: "Jul", Amazon: 27990, Flipkart: 28490, Croma: 28990 },
      { month: "Aug", Amazon: 24990, Flipkart: 25490, Croma: 26490 },
      { month: "Sep", Amazon: 22990, Flipkart: 23990, Croma: 24990 },
      { month: "Oct", Amazon: 21990, Flipkart: 22990, Croma: 23990 },
      { month: "Nov", Amazon: 20990, Flipkart: 21990, Croma: 23490 },
      { month: "Dec", Amazon: 20490, Flipkart: 21490, Croma: 22990 },
      { month: "Jan", Amazon: 19990, Flipkart: 21490, Croma: 22990 },
    ],
    lowestPrice: 19990,
    maxSavings: 10000,
  },

  "samsung-galaxy-s25-ultra": {
    id: "samsung-galaxy-s25-ultra",
    name: "Samsung Galaxy S25 Ultra",
    category: "Smartphones",
    emoji: "📱",
    variant: "512GB, Titanium Black",
    storePrices: [
      {
        id: "amazon-samsung",
        storeName: "Amazon",
        price: 124999,
        originalPrice: 149999,
        discount: 17,
        deliveryInfo: "Free delivery by 11 Apr",
        logoInitials: "AM",
        logoColor: "from-orange-400 to-orange-600",
        isQuickCommerce: false,
      },
      {
        id: "flipkart-samsung",
        storeName: "Flipkart",
        price: 119999,
        originalPrice: 149999,
        discount: 20,
        deliveryInfo: "Free delivery by 10 Apr",
        logoInitials: "FK",
        logoColor: "from-blue-400 to-blue-600",
        isQuickCommerce: false,
      },
      {
        id: "croma-samsung",
        storeName: "Croma",
        price: 129999,
        originalPrice: 149999,
        discount: 13,
        deliveryInfo: "Free delivery by 12 Apr",
        logoInitials: "CR",
        logoColor: "from-green-400 to-green-600",
        isQuickCommerce: false,
      },
    ],
    priceHistory: [
      { month: "Sep", Amazon: 149999, Flipkart: 149999, Croma: 149999 },
      { month: "Oct", Amazon: 139999, Flipkart: 135999, Croma: 144999 },
      { month: "Nov", Amazon: 134999, Flipkart: 129999, Croma: 139999 },
      { month: "Dec", Amazon: 129999, Flipkart: 124999, Croma: 134999 },
      { month: "Jan", Amazon: 127999, Flipkart: 122999, Croma: 132999 },
      { month: "Feb", Amazon: 126999, Flipkart: 120999, Croma: 131999 },
      { month: "Mar", Amazon: 125999, Flipkart: 120499, Croma: 130999 },
      { month: "Apr", Amazon: 124999, Flipkart: 119999, Croma: 129999 },
    ],
    lowestPrice: 119999,
    maxSavings: 30000,
  },

  "atta-1kg": {
    id: "atta-1kg",
    name: "Aashirvaad Select Chakki Atta",
    category: "Groceries",
    emoji: "🌾",
    variant: "1kg Pack",
    storePrices: [
      {
        id: "blinkit-atta",
        storeName: "Blinkit",
        price: 42,
        originalPrice: 45,
        discount: 7,
        deliveryInfo: "Delivered in 8 min",
        logoInitials: "BK",
        logoColor: "from-yellow-300 to-yellow-500",
        isQuickCommerce: true,
        deliveryTime: "8 min",
      },
      {
        id: "zepto-atta",
        storeName: "Zepto",
        price: 43,
        originalPrice: 45,
        discount: 4,
        deliveryInfo: "Delivered in 10 min",
        logoInitials: "ZP",
        logoColor: "from-cyan-400 to-cyan-600",
        isQuickCommerce: true,
        deliveryTime: "10 min",
      },
      {
        id: "swiggy-atta",
        storeName: "Swiggy Instamart",
        price: 44,
        originalPrice: 45,
        discount: 2,
        deliveryInfo: "Delivered in 12 min",
        logoInitials: "SI",
        logoColor: "from-orange-400 to-red-600",
        isQuickCommerce: true,
        deliveryTime: "12 min",
      },
    ],
    priceHistory: [
      { month: "Jun", Blinkit: 50, Zepto: 50, "Swiggy Instamart": 50 },
      { month: "Jul", Blinkit: 48, Zepto: 48, "Swiggy Instamart": 48 },
      { month: "Aug", Blinkit: 47, Zepto: 47, "Swiggy Instamart": 47 },
      { month: "Sep", Blinkit: 45, Zepto: 45, "Swiggy Instamart": 45 },
      { month: "Oct", Blinkit: 44, Zepto: 44, "Swiggy Instamart": 44 },
      { month: "Nov", Blinkit: 43, Zepto: 43, "Swiggy Instamart": 43 },
      { month: "Dec", Blinkit: 42, Zepto: 42, "Swiggy Instamart": 43 },
      { month: "Jan", Blinkit: 42, Zepto: 43, "Swiggy Instamart": 44 },
    ],
    lowestPrice: 42,
    maxSavings: 3,
  },
};

export function getProductBySearchQuery(query: string): Product | null {
  const normalizedQuery = query.toLowerCase().replace(/\s+/g, "-");

  // Check for exact match
  if (mockProducts[normalizedQuery]) {
    return mockProducts[normalizedQuery];
  }

  // Check for partial matches
  for (const [key, product] of Object.entries(mockProducts)) {
    if (
      key.includes(normalizedQuery) ||
      product.name.toLowerCase().includes(query.toLowerCase())
    ) {
      return product;
    }
  }

  // Return a default product for demo
  return mockProducts["iphone-16-128gb"];
}
