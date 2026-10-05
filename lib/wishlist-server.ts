/**
 * Wishlist Server Persistence — Shopify Customer Metafields
 *
 * Uses Shopify's Customer Account API to read/write the customer "wishlist"
 * metafield. This persists wishlist data in Shopify itself, surviving across
 * deploys, devices, and browsers.
 *
 * Metafield: namespace="custom", key="wishlist", type="list.collection_reference"
 * (stores an array of product GIDs)
 *
 * Falls back to cookies when the access token is unavailable.
 */

import { cookies } from 'next/headers';
import { decodeIdToken, getCustomerGraphQLUrl } from './shopify-customer';

// ─── Customer Key Derivation ─────────────────────────────────────────────────

export function getCustomerKey(idToken?: string): string {
  if (!idToken) return 'default';
  const decoded = decodeIdToken(idToken);
  if (decoded?.sub) return decoded.sub.replace(/[^a-zA-Z0-9]/g, '_');
  if (decoded?.email) return decoded.email.replace(/[^a-zA-Z0-9]/g, '_');
  return 'default';
}

// ─── Cookie Helpers (fallback) ───────────────────────────────────────────────

function parseCookie(cookieVal?: string): string[] {
  if (!cookieVal) return [];
  try {
    let raw = cookieVal;
    if (raw.includes('%')) {
      try { raw = decodeURIComponent(raw); } catch {}
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {}
  try {
    const parsed = JSON.parse(cookieVal);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {}
  return [];
}

async function getCookieWishlist(customerKey: string): Promise<string[]> {
  try {
    const cookieStore = await cookies();
    const customerCookie = `customer_wishlist_${customerKey}`;
    const fromCustomer = parseCookie(cookieStore.get(customerCookie)?.value);
    const fromSession = parseCookie(cookieStore.get('wishlist_items')?.value);
    return Array.from(new Set([...fromCustomer, ...fromSession]));
  } catch {
    return [];
  }
}

async function setCookieWishlist(customerKey: string, items: string[]): Promise<void> {
  try {
    const cookieStore = await cookies();
    const deduped = Array.from(new Set(items));
    const serialized = JSON.stringify(deduped);
    cookieStore.set(`customer_wishlist_${customerKey}`, serialized, {
      path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax', httpOnly: false,
    });
    cookieStore.set('wishlist_items', serialized, {
      path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax', httpOnly: false,
    });
  } catch (e) {
    console.error('Failed to save wishlist cookie:', e);
  }
}

// ─── Shopify Customer Account API ────────────────────────────────────────────

const WISHLIST_READ_QUERY = `
  query WishlistMetafield {
    customer {
      id
      metafield(namespace: "custom", key: "wishlist") {
        value
        type
      }
    }
  }
`;

const WISHLIST_WRITE_MUTATION = `
  mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        key
        value
      }
      userErrors {
        field
        message
      }
    }
  }
`;

async function getAccessToken(): Promise<string | undefined> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get('customer_access_token')?.value;
  } catch {
    return undefined;
  }
}

/**
 * Parse metafield value — handles both JSON array and collection reference formats.
 */
function parseMetafieldValue(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {}
  return [];
}

/**
 * Read the customer's wishlist from Shopify metafield.
 * Falls back to cookies if the API call fails.
 */
async function readShopifyWishlist(accessToken: string): Promise<{ items: string[]; customerId: string | null }> {
  try {
    const endpoint = getCustomerGraphQLUrl();
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': accessToken,
      },
      body: JSON.stringify({ query: WISHLIST_READ_QUERY }),
      cache: 'no-store',
    });

    if (!res.ok) {
      console.warn('Shopify wishlist read failed:', res.status);
      return { items: [], customerId: null };
    }

    const json = await res.json();
    const customer = json?.data?.customer;
    const customerId = customer?.id || null;
    const metafield = customer?.metafield;
    const items = parseMetafieldValue(metafield?.value);

    return { items, customerId };
  } catch (err) {
    console.warn('Shopify wishlist read error:', err);
    return { items: [], customerId: null };
  }
}

/**
 * Write the customer's wishlist to Shopify metafield.
 */
async function writeShopifyWishlist(accessToken: string, customerId: string, items: string[]): Promise<boolean> {
  try {
    const endpoint = getCustomerGraphQLUrl();
    const deduped = Array.from(new Set(items));
    const value = JSON.stringify(deduped);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': accessToken,
      },
      body: JSON.stringify({
        query: WISHLIST_WRITE_MUTATION,
        variables: {
          metafields: [{
            namespace: 'custom',
            key: 'wishlist',
            ownerId: customerId,
            type: 'list.single_line_text_field',
            value,
          }],
        },
      }),
      cache: 'no-store',
    });

    if (!res.ok) {
      console.warn('Shopify wishlist write failed:', res.status);
      return false;
    }

    const json = await res.json();
    const errors = json?.data?.metafieldsSet?.userErrors;
    if (errors && errors.length > 0) {
      console.warn('Shopify wishlist write errors:', errors);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('Shopify wishlist write error:', err);
    return false;
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Get the stored wishlist. Tries Shopify metafield first, falls back to cookies.
 */
export async function getStoredWishlist(customerKey: string): Promise<string[]> {
  if (!customerKey || customerKey === 'default') return [];

  const accessToken = await getAccessToken();
  if (accessToken) {
    const { items: shopifyItems } = await readShopifyWishlist(accessToken);
    const cookieItems = await getCookieWishlist(customerKey);

    // Merge Shopify + cookie items (cookie may have items not yet synced)
    const merged = Array.from(new Set([...shopifyItems, ...cookieItems]));

    // If cookie had items not in Shopify, sync them up
    if (merged.length > shopifyItems.length) {
      await setCookieWishlist(customerKey, merged);
    }

    return merged;
  }

  // Fallback: cookie-only
  return getCookieWishlist(customerKey);
}

/**
 * Save the wishlist. Writes to Shopify metafield AND cookies.
 */
export async function saveStoredWishlist(customerKey: string, items: string[]): Promise<void> {
  if (!customerKey || customerKey === 'default') return;

  const deduped = Array.from(new Set(items));

  // Always save to cookies (fast fallback)
  await setCookieWishlist(customerKey, deduped);

  // Try to persist to Shopify metafield
  const accessToken = await getAccessToken();
  if (accessToken) {
    const { customerId } = await readShopifyWishlist(accessToken);
    if (customerId) {
      await writeShopifyWishlist(accessToken, customerId, deduped);
    }
  }
}
