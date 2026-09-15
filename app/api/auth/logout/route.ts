import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const idToken = cookieStore.get('customer_id_token')?.value;

  // Persist the customer's current wishlist to server storage BEFORE clearing cookies
  try {
    const { getCustomerKey, getStoredWishlist, saveStoredWishlist } = await import('@/lib/wishlist-server');
    const customerKey = getCustomerKey(idToken);
    if (customerKey && customerKey !== 'default') {
      // Gather items from all cookie sources
      const wishlistCookie = cookieStore.get('wishlist_items')?.value;
      const customerWishlistCookie = cookieStore.get('customer_wishlist_' + customerKey)?.value;
      
      const parseItems = (val?: string): string[] => {
        if (!val) return [];
        try {
          let raw = val;
          if (raw.includes('%')) { try { raw = decodeURIComponent(raw); } catch {} }
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? parsed.map(String) : [];
        } catch { return []; }
      };

      const cookieItems = [
        ...parseItems(wishlistCookie),
        ...parseItems(customerWishlistCookie),
      ];
      const serverItems = getStoredWishlist(customerKey);
      const merged = Array.from(new Set([...serverItems, ...cookieItems]));
      if (merged.length > 0) {
        saveStoredWishlist(customerKey, merged);
      }
    }
  } catch (err) {
    console.warn('Could not persist wishlist on logout:', err);
  }
  
  // Clear all auth cookies
  cookieStore.delete('customer_access_token');
  cookieStore.delete('customer_id_token');
  cookieStore.delete('customer_logged_in');
  cookieStore.delete('customer_refresh_token');
  cookieStore.delete('wishlist_items');

  // Clear any customer-specific wishlist cookies
  const allCookies = cookieStore.getAll();
  for (const cookie of allCookies) {
    if (cookie.name.startsWith('customer_wishlist_')) {
      cookieStore.delete(cookie.name);
    }
  }

  // Note: We intentionally keep the cart_id cookie so the cart survives logout
  // The user can continue shopping as a guest with the same cart

  const logoutUrl = process.env.SHOPIFY_LOGOUT_URL;
  const clientId = process.env.SHOPIFY_CUSTOMER_API_CLIENT_ID;
  const url = new URL(request.url);
  
  if (logoutUrl) {
    const shopifyLogout = new URL(logoutUrl);
    if (idToken) {
      shopifyLogout.searchParams.append('id_token_hint', idToken);
    }
    shopifyLogout.searchParams.append('post_logout_redirect_uri', url.origin);
    if (clientId) {
        shopifyLogout.searchParams.append('client_id', clientId);
    }
    return NextResponse.redirect(shopifyLogout.toString());
  }

  // Fallback if URL isn't configured
  return NextResponse.redirect(new URL('/', url.origin));
}
