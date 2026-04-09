export type StoreType = "ecommerce" | "quick-commerce";

export interface Store {
  name: string;
  code: string;
  color: string;
  type: StoreType;
  deliveryInfo: string;
  logo?: string;
}

export const STORES: Store[] = [
  {
    name: "Amazon",
    code: "AMZ",
    color: "#FF9900",
    type: "ecommerce",
    deliveryInfo: "Prime: 1-2 days, Standard: 3-5 days",
  },
  {
    name: "Flipkart",
    code: "FK",
    color: "#1F40FB",
    type: "ecommerce",
    deliveryInfo: "Next day delivery available, Standard: 3-5 days",
  },
  {
    name: "Croma",
    code: "CRM",
    color: "#E4405F",
    type: "ecommerce",
    deliveryInfo: "1-2 days delivery, Electronics focused",
  },
  {
    name: "Reliance Digital",
    code: "RDL",
    color: "#12239E",
    type: "ecommerce",
    deliveryInfo: "Same day delivery in major cities",
  },
  {
    name: "Tata Cliq",
    code: "TCQ",
    color: "#C1272D",
    type: "ecommerce",
    deliveryInfo: "2-3 days delivery, Free shipping on 1000+",
  },
  {
    name: "Vijay Sales",
    code: "VS",
    color: "#FFD700",
    type: "ecommerce",
    deliveryInfo: "2-3 days delivery, Electronics & appliances",
  },
  {
    name: "Blinkit",
    code: "BLT",
    color: "#FDD835",
    type: "quick-commerce",
    deliveryInfo: "10-15 minutes delivery",
  },
  {
    name: "Zepto",
    code: "ZPT",
    color: "#6930C3",
    type: "quick-commerce",
    deliveryInfo: "10-15 minutes delivery",
  },
  {
    name: "Swiggy Instamart",
    code: "SW",
    color: "#F97316",
    type: "quick-commerce",
    deliveryInfo: "15-20 minutes delivery",
  },
  {
    name: "BigBasket",
    code: "BB",
    color: "#E67E22",
    type: "ecommerce",
    deliveryInfo: "Same day delivery, Groceries & essentials",
  },
  {
    name: "Myntra",
    code: "MYN",
    color: "#EE5A24",
    type: "ecommerce",
    deliveryInfo: "2-3 days delivery, Fashion focused",
  },
  {
    name: "Ajio",
    code: "AJO",
    color: "#6200EE",
    type: "ecommerce",
    deliveryInfo: "2-3 days delivery, Fashion & lifestyle",
  },
];

export const STORE_BY_CODE = Object.fromEntries(
  STORES.map((store) => [store.code, store])
);

export const ECOMMERCE_STORES = STORES.filter((s) => s.type === "ecommerce");
export const QUICK_COMMERCE_STORES = STORES.filter(
  (s) => s.type === "quick-commerce"
);
