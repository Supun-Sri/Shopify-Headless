import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Random string generator for PKCE challenge and state
function generateRandomString(length: number) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export async function GET(request: Request) {
  const clientId = process.env.SHOPIFY_CUSTOMER_API_CLIENT_ID;
  const authUrl = process.env.SHOPIFY_AUTH_URL;
  
  if (!clientId || !authUrl) {
    return NextResponse.json({ error: 'Shopify Customer API credentials not configured.' }, { status: 500 });
  }

  // 1. Generate state and nonce
  const state = generateRandomString(32);
  const nonce = generateRandomString(32);

  const codeVerifier = generateRandomString(64);
  
  const cookieStore = await cookies();
  cookieStore.set('shopify_auth_state', state, { httpOnly: true, secure: true, maxAge: 60 * 10 });
  cookieStore.set('shopify_auth_nonce', nonce, { httpOnly: true, secure: true, maxAge: 60 * 10 });
  cookieStore.set('shopify_auth_code_verifier', codeVerifier, { httpOnly: true, secure: true, maxAge: 60 * 10 });

  const url = new URL(request.url);
  const redirectUri = `${url.origin}/api/auth/callback`;

  // Shopify Customer Account Authorization Endpoint
  const authorizationUrl = new URL(authUrl);
  authorizationUrl.searchParams.append('client_id', clientId);
  authorizationUrl.searchParams.append('response_type', 'code');
  authorizationUrl.searchParams.append('redirect_uri', redirectUri);
  authorizationUrl.searchParams.append('scope', 'openid email unauthenticated_read_customer_account unauthenticated_write_customer_account');
  authorizationUrl.searchParams.append('state', state);
  authorizationUrl.searchParams.append('nonce', nonce);

  return NextResponse.redirect(authorizationUrl.toString());
}
