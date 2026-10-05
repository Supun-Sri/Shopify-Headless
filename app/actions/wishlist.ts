'use server';

import { cookies } from 'next/headers';
import { getCustomerKey, getStoredWishlist, saveStoredWishlist } from '@/lib/wishlist-server';

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
    const items = await getStoredWishlist(customerKey);
    return items;
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

    const customerKey = getCustomerKey(idToken);

    const baseItems = Array.isArray(clientItems) && clientItems.length > 0
      ? clientItems
      : await getStoredWishlist(customerKey);

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

    await saveStoredWishlist(customerKey, updated);

    // NOTE: We intentionally do NOT call revalidatePath() here.
    // The client-side Zustand store is the source of truth for the UI.
    // Calling revalidatePath() triggers a layout re-render which races with
    // the optimistic state update and causes the toggle to revert.

    return { success: true, items: updated };
  } catch (err: any) {
    console.error('Failed to toggle wishlist:', err);
    return { success: false, items: [], error: err?.message || 'Server error' };
  }
}
