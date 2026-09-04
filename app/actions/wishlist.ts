'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { decodeIdToken } from '@/lib/shopify-customer';

function getCustomerKey(idToken?: string): string {
  if (!idToken) return 'default';
  const decoded = decodeIdToken(idToken);
  if (decoded?.sub) {
    return decoded.sub.replace(/[^a-zA-Z0-9]/g, '_');
  }
  return 'default';
}

function parseWishlistCookie(cookieVal?: string): string[] {
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
    
    const fromCustomer = parseWishlistCookie(cookieStore.get(customerCookie)?.value);
    const fromSession = parseWishlistCookie(cookieStore.get('wishlist_items')?.value);

    // Merge both sources so a newly written session cookie isn't masked by an older empty customer cookie
    const combined = Array.from(new Set([...fromCustomer, ...fromSession]));
    return combined;
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
  action?: 'add' | 'remove',
  clientItems?: string[]
): Promise<WishlistResult> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('customer_access_token')?.value;
    const idToken = cookieStore.get('customer_id_token')?.value;

    // Reject unauthenticated requests gracefully
    if (!accessToken && !idToken) {
      return { success: false, items: [], error: 'UNAUTHENTICATED' };
    }

    const baseItems = Array.isArray(clientItems) && clientItems.length > 0
      ? clientItems
      : await getWishlist();

    let updated: string[];
    if (action === 'add') {
      updated = Array.from(new Set([...baseItems, productId]));
    } else if (action === 'remove') {
      updated = baseItems.filter(
        (id) => id !== productId && !productId.endsWith('/' + id) && !id.endsWith('/' + productId)
      );
    } else {
      const isAdded =
        baseItems.includes(productId) ||
        baseItems.some((id) => productId.endsWith('/' + id) || id.endsWith('/' + productId));
      updated = isAdded
        ? baseItems.filter(
            (id) => id !== productId && !productId.endsWith('/' + id) && !id.endsWith('/' + productId)
          )
        : [...baseItems, productId];
    }

    const customerKey = getCustomerKey(idToken);
    const customerCookie = `customer_wishlist_${customerKey}`;
    const serialized = JSON.stringify(updated);

    // Save to customer-specific cookie
    cookieStore.set(customerCookie, serialized, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      httpOnly: false,
    });

    // Also sync session cookie
    cookieStore.set('wishlist_items', serialized, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      httpOnly: false,
    });

    // Revalidate Next.js cache so any prefetched or cached customer pages update immediately
    try {
      revalidatePath('/account/wishlist');
      revalidatePath('/account');
    } catch {}

    return { success: true, items: updated };
  } catch (err: any) {
    console.error('Failed to toggle wishlist:', err);
    return { success: false, items: [], error: err?.message || 'Server error' };
  }
}
