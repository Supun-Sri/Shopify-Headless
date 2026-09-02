'use server';

import { cookies } from 'next/headers';

const METAFIELD_NAMESPACE = 'custom';
const METAFIELD_KEY = 'wishlist';

async function customerFetch(query: string, variables?: any) {
  const cookieStore = await cookies();
  const token = cookieStore.get('customer_access_token')?.value;
  const shopDomain = process.env.SHOPIFY_STORE_DOMAIN;

  if (!token) throw new Error('Unauthorized');
  if (!shopDomain) throw new Error('Store domain missing');

  const res = await fetch(`https://${shopDomain}/account/customer/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token, // The Customer Account API accepts the token directly in the Authorization header
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error('Customer Account API error');
  }

  const json = await res.json();
  if (json.errors) {
    console.error('GraphQL Errors:', json.errors);
    throw new Error('Customer Account API GraphQL error');
  }

  return json.data;
}

export async function getWishlist(): Promise<string[]> {
  try {
    const data = await customerFetch(`
      query getWishlist {
        customer {
          id
          metafield(namespace: "${METAFIELD_NAMESPACE}", key: "${METAFIELD_KEY}") {
            value
          }
        }
      }
    `);
    const val = data?.customer?.metafield?.value;
    return val ? JSON.parse(val) : [];
  } catch (err) {
    return [];
  }
}

export async function toggleWishlistItem(productId: string): Promise<string[]> {
  try {
    const current = await getWishlist();
    const isAdded = current.includes(productId);
    
    let updated;
    if (isAdded) {
      updated = current.filter((id) => id !== productId);
    } else {
      updated = [...current, productId];
    }

    const value = JSON.stringify(updated);

    await customerFetch(`
      mutation setWishlist($metafields: [MetafieldInput!]!) {
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
    `, {
      metafields: [
        {
          namespace: METAFIELD_NAMESPACE,
          key: METAFIELD_KEY,
          type: 'json',
          value,
        }
      ]
    });

    return updated;
  } catch (err) {
    console.error('Failed to toggle wishlist:', err);
    throw err;
  }
}
