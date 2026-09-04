import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const idToken = cookieStore.get('customer_id_token')?.value; // Usually returned along with access_token
  
  // Clear local cookies
  cookieStore.delete('customer_access_token');
  cookieStore.delete('customer_id_token');
  cookieStore.delete('customer_logged_in');
  cookieStore.delete('wishlist_items');

  const logoutUrl = process.env.SHOPIFY_LOGOUT_URL;
  const clientId = process.env.SHOPIFY_CUSTOMER_API_CLIENT_ID;
  const url = new URL(request.url);
  
  if (logoutUrl) {
    const shopifyLogout = new URL(logoutUrl);
    // Shopify New Customer Account API expects id_token_hint for a clean logout if available
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
