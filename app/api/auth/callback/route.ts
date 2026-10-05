import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  const cookieStore = await cookies();
  const savedState = cookieStore.get('shopify_auth_state')?.value;
  const codeVerifier = cookieStore.get('shopify_auth_code_verifier')?.value;

  const clientId = process.env.SHOPIFY_CUSTOMER_API_CLIENT_ID;
  const tokenUrl = process.env.SHOPIFY_TOKEN_URL;

  if (!state || state !== savedState) {
    return NextResponse.redirect(new URL('/account?error=invalid_state', url.origin));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/account?error=no_code', url.origin));
  }

  try {
    // Must match the redirect_uri used in the login route exactly
    let rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.URL || url.origin;
    if (!rawSiteUrl.startsWith('http')) {
      rawSiteUrl = `https://${rawSiteUrl}`;
    }
    const siteOrigin = rawSiteUrl.replace(/\/$/, '');
    const redirectUri = `${siteOrigin}/api/auth/callback`;

    // Exchange code for token
    const tokenResponse = await fetch(tokenUrl!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId!,
        redirect_uri: redirectUri,
        code,
        code_verifier: codeVerifier || '',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token exchange failed:', errorData);
      return NextResponse.redirect(new URL('/account?error=token_failed', url.origin));
    }

    const data = await tokenResponse.json();
    
    const response = NextResponse.redirect(new URL('/account', url.origin));
    const isProduction = process.env.NODE_ENV === 'production';
    const tokenExpiry = data.expires_in || 3600;
    
    // Store access_token
    if (data.access_token) {
      response.cookies.set('customer_access_token', data.access_token, {
        httpOnly: true,
        secure: isProduction,
        maxAge: tokenExpiry,
        path: '/',
        sameSite: 'lax',
      });
    }
    
    // Store id_token
    if (data.id_token) {
      response.cookies.set('customer_id_token', data.id_token, {
        httpOnly: true,
        secure: isProduction,
        maxAge: tokenExpiry,
        path: '/',
        sameSite: 'lax',
      });

      // Restore customer persistent wishlist into session cookies
      try {
        const { getCustomerKey, getStoredWishlist } = await import('@/lib/wishlist-server');
        const customerKey = getCustomerKey(data.id_token);
        const saved = await getStoredWishlist(customerKey);
        if (saved && saved.length > 0) {
          const serialized = JSON.stringify(saved);
          response.cookies.set('wishlist_items', serialized, {
            path: '/',
            maxAge: 60 * 60 * 24 * 365,
            sameSite: 'lax',
            httpOnly: false,
          });
          response.cookies.set('customer_wishlist_' + customerKey, serialized, {
            path: '/',
            maxAge: 60 * 60 * 24 * 365,
            sameSite: 'lax',
            httpOnly: false,
          });
        }
      } catch (err) {
        console.warn('Could not restore persistent wishlist on callback:', err);
      }
    }

    // Store refresh_token if provided by Shopify (for session renewal)
    if (data.refresh_token) {
      response.cookies.set('customer_refresh_token', data.refresh_token, {
        httpOnly: true,
        secure: isProduction,
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
        sameSite: 'lax',
      });
    }

    // Set client-accessible auth indicator cookie
    response.cookies.set('customer_logged_in', '1', {
      httpOnly: false,
      secure: isProduction,
      maxAge: tokenExpiry,
      path: '/',
      sameSite: 'lax',
    });

    // Associate existing Shopify cart with the authenticated customer, and sync with MongoDB
    try {
      const { getCustomerKey, saveStoredCartId, getStoredCartId } = await import('@/lib/wishlist-server');
      const customerKey = getCustomerKey(data.id_token);
      
      const localCartId = cookieStore.get('cart_id')?.value;
      const dbCartId = await getStoredCartId(customerKey);
      
      if (localCartId) {
        if (data.access_token) {
          const { updateCartBuyerIdentity } = await import('@/lib/shopify-api');
          await updateCartBuyerIdentity(localCartId, data.access_token);
        }
        await saveStoredCartId(customerKey, localCartId);
      } else if (dbCartId) {
        response.cookies.set('cart_id', dbCartId, {
          path: '/',
          maxAge: 60 * 60 * 24 * 365,
          sameSite: 'lax',
          httpOnly: false,
        });
      }
    } catch (err) {
      console.warn('Could not sync cart with MongoDB:', err);
    }

    // Clean up PKCE cookies
    response.cookies.delete('shopify_auth_state');
    response.cookies.delete('shopify_auth_nonce');
    response.cookies.delete('shopify_auth_code_verifier');

    return response;
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(new URL('/account?error=server_error', url.origin));
  }
}
