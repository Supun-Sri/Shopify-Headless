import { shopifyFetch } from './shopify';
import {
  PRODUCTS_QUERY,
  PRODUCT_BY_HANDLE_QUERY,
  PRODUCT_RECOMMENDATIONS_QUERY,
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
    tags: ['product', handle],
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

export async function getCollections(
  first = 10
): Promise<ShopifyCollection[]> {
  const data = await shopifyFetch<{
    collections: ShopifyConnection<ShopifyCollection>;
  }>({
    query: COLLECTIONS_QUERY,
    variables: { first },
    tags: ['collections'],
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

function normalizeCart(raw: Record<string, unknown>): Cart {
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
    cartCreate: { cart: Record<string, unknown> };
  }>({
    query: CREATE_CART_MUTATION,
    variables: { lines },
    cache: 'no-store',
  });

  return normalizeCart(data.cartCreate.cart);
}

export async function addToCart(
  cartId: string,
  lines: { merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  const data = await shopifyFetch<{
    cartLinesAdd: { cart: Record<string, unknown> };
  }>({
    query: ADD_TO_CART_MUTATION,
    variables: { cartId, lines },
    cache: 'no-store',
  });

  return normalizeCart(data.cartLinesAdd.cart);
}

export async function updateCartLine(
  cartId: string,
  lines: { id: string; quantity: number }[]
): Promise<Cart> {
  const data = await shopifyFetch<{
    cartLinesUpdate: { cart: Record<string, unknown> };
  }>({
    query: UPDATE_CART_LINE_MUTATION,
    variables: { cartId, lines },
    cache: 'no-store',
  });

  return normalizeCart(data.cartLinesUpdate.cart);
}

export async function removeFromCart(
  cartId: string,
  lineIds: string[]
): Promise<Cart> {
  const data = await shopifyFetch<{
    cartLinesRemove: { cart: Record<string, unknown> };
  }>({
    query: REMOVE_FROM_CART_MUTATION,
    variables: { cartId, lineIds },
    cache: 'no-store',
  });

  return normalizeCart(data.cartLinesRemove.cart);
}
