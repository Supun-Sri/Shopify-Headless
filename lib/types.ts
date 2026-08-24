// ─── Shopify Storefront API Types ────────────────────────────────────────────

export interface Money {
  amount: string;
  currencyCode: string;
}

export interface ShopifyImage {
  url: string;
  altText: string | null;
  width?: number;
  height?: number;
}

export interface ShopifyVariant {
  id: string;
  title: string;
  price: Money;
  availableForSale: boolean;
  quantityAvailable: number | null;
  selectedOptions: { name: string; value: string }[];
}

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  description: string;
  descriptionHtml: string;
  priceRange: {
    minVariantPrice: Money;
    maxVariantPrice: Money;
  };
  images: ShopifyImage[];
  variants: ShopifyVariant[];
  tags: string[];
  productType: string;
  vendor: string;
  availableForSale: boolean;
  totalInventory: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShopifyCollection {
  id: string;
  title: string;
  handle: string;
  description: string;
  image: ShopifyImage | null;
}

// ─── Cart Types ──────────────────────────────────────────────────────────────

export interface CartLineItem {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    price: Money;
    product: {
      title: string;
      handle: string;
      featuredImage: ShopifyImage | null;
    };
    selectedOptions: { name: string; value: string }[];
  };
}

export interface Cart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  lines: CartLineItem[];
  cost: {
    totalAmount: Money;
    subtotalAmount: Money;
    totalTaxAmount: Money | null;
  };
}

// ─── GraphQL Response Types ──────────────────────────────────────────────────

export interface ShopifyEdge<T> {
  node: T;
  cursor?: string;
}

export interface ShopifyConnection<T> {
  edges: ShopifyEdge<T>[];
  pageInfo?: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
}

export interface ShopifyProductRaw {
  id: string;
  title: string;
  handle: string;
  description: string;
  descriptionHtml: string;
  productType: string;
  vendor: string;
  tags: string[];
  availableForSale: boolean;
  totalInventory: number | null;
  createdAt: string;
  updatedAt: string;
  priceRange: {
    minVariantPrice: Money;
    maxVariantPrice: Money;
  };
  images: ShopifyConnection<ShopifyImage>;
  variants: ShopifyConnection<{
    id: string;
    title: string;
    price: Money;
    availableForSale: boolean;
    quantityAvailable: number | null;
    selectedOptions: { name: string; value: string }[];
  }>;
}

// ─── API Function Types ──────────────────────────────────────────────────────

export type SortKey = 'TITLE' | 'PRICE' | 'BEST_SELLING' | 'CREATED_AT' | 'RELEVANCE';

export interface ProductsQueryVariables {
  first?: number;
  after?: string;
  sortKey?: SortKey;
  reverse?: boolean;
  query?: string;
}
