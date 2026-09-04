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
    return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: 'Authorization code missing' }, { status: 400 });
  }

  try {
    const redirectUri = `${url.origin}/api/auth/callback`;

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
      return NextResponse.redirect(new URL('/login?error=token_failed', url.origin));
    }

    const data = await tokenResponse.json();
    
    // data.access_token contains the Customer Account API access token
    if (data.access_token) {
      cookieStore.set('customer_access_token', data.access_token, {
        httpOnly: true,
        secure: true,
        maxAge: data.expires_in || 3600,
        path: '/',
      });
    }
    
    if (data.id_token) {
      cookieStore.set('customer_id_token', data.id_token, {
        httpOnly: true,
        secure: true,
        maxAge: data.expires_in || 3600,
        path: '/',
      });
    }

    // Set client-accessible auth indicator cookie
    cookieStore.set('customer_logged_in', '1', {
      httpOnly: false,
      secure: true,
      maxAge: data.expires_in || 3600,
      path: '/',
      sameSite: 'lax',
    });

    // Clean up PKCE cookies
    cookieStore.delete('shopify_auth_state');
    cookieStore.delete('shopify_auth_nonce');
    cookieStore.delete('shopify_auth_code_verifier');

    return NextResponse.redirect(new URL('/account', url.origin));
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(new URL('/login?error=server_error', url.origin));
  }
}
