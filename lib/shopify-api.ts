import { shopifyFetch } from './shopify';
import {
  PRODUCTS_QUERY,
  PRODUCT_BY_HANDLE_QUERY,
  PRODUCT_RECOMMENDATIONS_QUERY,
  PRODUCT_FILTERS_QUERY,
  COLLECTIONS_QUERY,
  COLLECTION_BY_HANDLE_QUERY,
  CREATE_CART_MUTATION,
  ADD_TO_CART_MUTATION,
  UPDATE_CART_LINE_MUTATION,
  REMOVE_FROM_CART_MUTATION,
} from './queries';
import type {
  ShopifyProduct,
  ShopifyProductRaw,
  ShopifyCollection,
  Cart,
  CartLineItem,
  ShopifyConnection,
  ProductsQueryVariables,
} from './types';
import { flattenConnection } from './utils';

// ─── Product Helpers ─────────────────────────────────────────────────────────

function normalizeProduct(raw: ShopifyProductRaw): ShopifyProduct {
  return {
    ...raw,
    images: flattenConnection(raw.images),
    variants: flattenConnection(raw.variants).map((v) => ({
      ...v,
      price: v.price,
    })),
  };
}

// ─── Product API ─────────────────────────────────────────────────────────────

export async function getAllProducts(
  options: ProductsQueryVariables = {}
): Promise<{
  products: ShopifyProduct[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
}> {
  const { first = 12, after, sortKey = 'RELEVANCE', reverse = false, query } = options;

  const data = await shopifyFetch<{
    products: ShopifyConnection<ShopifyProductRaw> & {
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
    };
  }>({
    query: PRODUCTS_QUERY,
    variables: { first, after, sortKey, reverse, query },
    tags: ['products'],
    revalidate: 60, // ISR: re-fetch from Shopify at most every 60 s
  });

  return {
    products: flattenConnection(data.products).map(normalizeProduct),
    pageInfo: data.products.pageInfo ?? { hasNextPage: false, endCursor: null },
  };
}

export async function getProductByHandle(
  handle: string
): Promise<ShopifyProduct | null> {
  const data = await shopifyFetch<{
    productByHandle: ShopifyProductRaw | null;
  }>({
    query: PRODUCT_BY_HANDLE_QUERY,
    variables: { handle },
    tags: ['product', `product-${handle}`],
    revalidate: 60,
  });

  if (!data.productByHandle) return null;
  return normalizeProduct(data.productByHandle);
}

export async function getProductRecommendations(
  productId: string
): Promise<ShopifyProduct[]> {
  try {
    const data = await shopifyFetch<{
      productRecommendations: ShopifyProductRaw[];
    }>({
      query: PRODUCT_RECOMMENDATIONS_QUERY,
      variables: { productId },
      tags: ['recommendations'],
    });

    return (data.productRecommendations || []).map((p) => ({
      ...p,
      images: p.images ? flattenConnection(p.images) : [],
      variants: p.variants ? flattenConnection(p.variants) : [],
    })) as ShopifyProduct[];
  } catch {
    return [];
  }
}

// ─── Collection API ──────────────────────────────────────────────────────────

export interface ProductFilters {
  vendors: string[];
  productTypes: string[];
  tags: string[];
  minPrice: number;
  maxPrice: number;
  currency: string;
}

export async function getProductFilters(collectionHandle?: string): Promise<ProductFilters> {
  try {
    const query = collectionHandle ? `collection:${collectionHandle}` : undefined;
    const data = await shopifyFetch<{
      products: {
        edges: {
          node: {
            vendor: string;
            productType: string;
            tags: string[];
            priceRange: {
              minVariantPrice: { amount: string; currencyCode: string };
              maxVariantPrice: { amount: string; currencyCode: string };
            };
          };
        }[];
      };
    }>({
      query: PRODUCT_FILTERS_QUERY,
      variables: { first: 250, query },
      tags: ['product-filters'],
    });

    const products = data.products.edges.map((e) => e.node);
    const vendors = [...new Set(products.map((p) => p.vendor).filter(Boolean))].sort();
    const productTypes = [...new Set(products.map((p) => p.productType).filter(Boolean))].sort();
    const allTags = products.flatMap((p) => p.tags);
    const tags = [...new Set(allTags)].sort().slice(0, 20); // cap at 20 tags

    let minPrice = Infinity;
    let maxPrice = 0;
    let currency = 'AED';
    for (const p of products) {
      const lo = parseFloat(p.priceRange.minVariantPrice.amount);
      const hi = parseFloat(p.priceRange.maxVariantPrice.amount);
      if (lo < minPrice) minPrice = lo;
      if (hi > maxPrice) maxPrice = hi;
      currency = p.priceRange.minVariantPrice.currencyCode;
    }
    if (!isFinite(minPrice)) minPrice = 0;
    if (maxPrice === 0) maxPrice = 10000;

    return { vendors, productTypes, tags, minPrice: Math.floor(minPrice), maxPrice: Math.ceil(maxPrice), currency };
  } catch {
    return { vendors: [], productTypes: [], tags: [], minPrice: 0, maxPrice: 10000, currency: 'AED' };
  }
}


export async function getCollections(
  first = 10
): Promise<ShopifyCollection[]> {
  const data = await shopifyFetch<{
    collections: ShopifyConnection<ShopifyCollection>;
  }>({
    query: COLLECTIONS_QUERY,
    variables: { first },
    tags: ['collections'],
    revalidate: 300, // collections change less often — revalidate every 5 min
  });

  return flattenConnection(data.collections);
}

export async function getCollectionProducts(
  handle: string,
  options: Omit<ProductsQueryVariables, 'query'> = {}
): Promise<{
  products: ShopifyProduct[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
  collection: { id: string; title: string; handle: string; description: string } | null;
}> {
  const { first = 24, after, sortKey = 'COLLECTION_DEFAULT', reverse = false } = options;

  try {
    const data = await shopifyFetch<{
      collection: {
        id: string;
        title: string;
        handle: string;
        description: string;
        products: ShopifyConnection<ShopifyProductRaw> & {
          pageInfo: { hasNextPage: boolean; endCursor: string | null };
        };
      } | null;
    }>({
      query: COLLECTION_BY_HANDLE_QUERY,
      variables: { handle, first, after, sortKey, reverse },
      tags: ['collection', handle],
    });

    if (!data.collection) {
      return {
        products: [],
        pageInfo: { hasNextPage: false, endCursor: null },
        collection: null,
      };
    }

    return {
      products: flattenConnection(data.collection.products).map(normalizeProduct),
      pageInfo: data.collection.products.pageInfo ?? { hasNextPage: false, endCursor: null },
      collection: {
        id: data.collection.id,
        title: data.collection.title,
        handle: data.collection.handle,
        description: data.collection.description,
      },
    };
  } catch {
    return {
      products: [],
      pageInfo: { hasNextPage: false, endCursor: null },
      collection: null,
    };
  }
}

// ─── Cart API ────────────────────────────────────────────────────────────────

function normalizeCart(raw: Record<string, unknown> | null): Cart {
  if (!raw) {
    throw new Error('Cart is null or invalid');
  }
  const cart = raw as {
    id: string;
    checkoutUrl: string;
    totalQuantity: number;
    lines: ShopifyConnection<CartLineItem>;
    cost: Cart['cost'];
  };

  return {
    ...cart,
    lines: flattenConnection(cart.lines),
  };
}

export async function createCart(
  lines: { merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  const data = await shopifyFetch<{
    cartCreate: { cart: Record<string, unknown> | null; userErrors: { message: string }[] };
  }>({
    query: CREATE_CART_MUTATION,
    variables: { lines },
    cache: 'no-store',
  });

  if (data.cartCreate.userErrors?.length) {
    throw new Error(data.cartCreate.userErrors[0].message);
  }

  return normalizeCart(data.cartCreate.cart);
}

export async function addToCart(
  cartId: string,
  lines: { merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  const data = await shopifyFetch<{
    cartLinesAdd: { cart: Record<string, unknown> | null; userErrors: { message: string }[] };
  }>({
    query: ADD_TO_CART_MUTATION,
    variables: { cartId, lines },
    cache: 'no-store',
  });

  if (data.cartLinesAdd.userErrors?.length) {
    throw new Error(data.cartLinesAdd.userErrors[0].message);
  }

  return normalizeCart(data.cartLinesAdd.cart);
}

export async function updateCartLine(
  cartId: string,
  lines: { id: string; quantity: number }[]
): Promise<Cart> {
  const data = await shopifyFetch<{
    cartLinesUpdate: { cart: Record<string, unknown> | null; userErrors: { message: string }[] };
  }>({
    query: UPDATE_CART_LINE_MUTATION,
    variables: { cartId, lines },
    cache: 'no-store',
  });

  if (data.cartLinesUpdate.userErrors?.length) {
    throw new Error(data.cartLinesUpdate.userErrors[0].message);
  }

  return normalizeCart(data.cartLinesUpdate.cart);
}

export async function removeFromCart(
  cartId: string,
  lineIds: string[]
): Promise<Cart> {
  const data = await shopifyFetch<{
    cartLinesRemove: { cart: Record<string, unknown> | null; userErrors: { message: string }[] };
  }>({
    query: REMOVE_FROM_CART_MUTATION,
    variables: { cartId, lineIds },
    cache: 'no-store',
  });

  if (data.cartLinesRemove.userErrors?.length) {
    throw new Error(data.cartLinesRemove.userErrors[0].message);
  }

  return normalizeCart(data.cartLinesRemove.cart);
}
