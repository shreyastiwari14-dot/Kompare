export interface ProductData {
  name: string;
  price: number | null;
  mrp: number | null;
  image: string | null;
  modelNumber: string | null;
  category: string | null;
  store: string;
  url: string;
  rating: number | null;
  inStock: boolean;
}

export interface ParsedLink {
  store:
    | 'amazon' | 'flipkart' | 'croma' | 'blinkit' | 'zepto'
    | 'myntra' | 'ajio' | 'reliance' | 'bigbasket'
    | 'tatacliq' | 'jiomart' | 'nykaa' | 'vijaysales'
    | 'unknown';
  productId: string;
}

export interface ComparisonResult {
  sourceProduct: ProductData;
  alternatives: ProductData[];
}
