'use server';

import { cookies } from 'next/headers';
import { getCustomerGraphQLUrl, decodeIdToken } from '@/lib/shopify-customer';

const METAFIELD_NAMESPACE = 'custom';
const METAFIELD_KEY = 'wishlist';

function getCustomerKey(idToken?: string): string {
  if (!idToken) return 'default';
  const decoded = decodeIdToken(idToken);
  if (decoded?.sub) {
    return decoded.sub.replace(/[^a-zA-Z0-9]/g, '_');
  }
  return 'default';
}

export async function getWishlist(): Promise<string[]> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('customer_access_token')?.value;
    const idToken = cookieStore.get('customer_id_token')?.value;

    // Wishlist is strictly for authenticated customers
    if (!accessToken && !idToken) {
      return [];
    }

    const customerKey = getCustomerKey(idToken);
    const customerCookie = `customer_wishlist_${customerKey}`;
    const cookieVal = cookieStore.get(customerCookie)?.value || cookieStore.get('wishlist_items')?.value;

    if (cookieVal) {
      try {
        const parsed = JSON.parse(decodeURIComponent(cookieVal));
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // Fall back to API
      }
    }

    // Check Customer Account API
    if (accessToken) {
      try {
        const endpoint = getCustomerGraphQLUrl();
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': accessToken,
          },
          body: JSON.stringify({
            query: `
              query getCustomerWishlist {
                customer {
                  id
                  metafield(namespace: "${METAFIELD_NAMESPACE}", key: "${METAFIELD_KEY}") {
                    value
                  }
                }
              }
            `,
          }),
          cache: 'no-store',
        });

        if (res.ok) {
          const json = await res.json();
          const val = json?.data?.customer?.metafield?.value;
          if (val) {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) return parsed;
          }
        }
      } catch {
        // Ignore API errors
      }
    }

    return [];
  } catch (err: any) {
    if (err?.digest === 'DYNAMIC_SERVER_USAGE' || err?.message?.includes('Dynamic server usage')) {
      throw err;
    }
    return [];
  }
}

export interface WishlistResult {
  success: boolean;
  items: string[];
  error?: string;
}

export async function toggleWishlistItem(
  productId: string,
  action?: 'add' | 'remove'
): Promise<WishlistResult> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('customer_access_token')?.value;
    const idToken = cookieStore.get('customer_id_token')?.value;

    // Reject unauthenticated requests gracefully
    if (!accessToken && !idToken) {
      return { success: false, items: [], error: 'UNAUTHENTICATED' };
    }

    const current = await getWishlist();
    let updated: string[];
    if (action === 'add') {
      updated = Array.from(new Set([...current, productId]));
    } else if (action === 'remove') {
      updated = current.filter(
        (id) => id !== productId && !productId.endsWith('/' + id) && !id.endsWith('/' + productId)
      );
    } else {
      const isAdded =
        current.includes(productId) ||
        current.some((id) => productId.endsWith('/' + id) || id.endsWith('/' + productId));
      updated = isAdded
        ? current.filter(
            (id) => id !== productId && !productId.endsWith('/' + id) && !id.endsWith('/' + productId)
          )
        : [...current, productId];
    }

    const customerKey = getCustomerKey(idToken);
    const customerCookie = `customer_wishlist_${customerKey}`;
    const encoded = encodeURIComponent(JSON.stringify(updated));

    // Save to customer-specific cookie
    cookieStore.set(customerCookie, encoded, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      httpOnly: false,
    });

    // Also sync session cookie
    cookieStore.set('wishlist_items', encoded, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      httpOnly: false,
    });

    // Sync to Shopify Customer Account API if token is valid
    if (accessToken) {
      try {
        const endpoint = getCustomerGraphQLUrl();
        const custRes = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': accessToken },
          body: JSON.stringify({ query: '{ customer { id } }' }),
          cache: 'no-store',
        });
        if (custRes.ok) {
          const custJson = await custRes.json();
          const customerId = custJson?.data?.customer?.id;
          if (customerId) {
            await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': accessToken },
              body: JSON.stringify({
                query: `
                  mutation setCustomerWishlist($metafields: [MetafieldsSetInput!]!) {
                    metafieldsSet(metafields: $metafields) {
                      metafields { key value }
                      userErrors { field message }
                    }
                  }
                `,
                variables: {
                  metafields: [
                    {
                      ownerId: customerId,
                      namespace: METAFIELD_NAMESPACE,
                      key: METAFIELD_KEY,
                      type: 'json',
                      value: JSON.stringify(updated),
                    },
                  ],
                },
              }),
              cache: 'no-store',
            });
          }
        }
      } catch (syncErr) {
        console.warn('Customer metafield sync skipped:', syncErr);
      }
    }

    return { success: true, items: updated };
  } catch (err: any) {
    console.error('Failed to toggle wishlist:', err);
    return { success: false, items: [], error: err?.message || 'Server error' };
  }
}
