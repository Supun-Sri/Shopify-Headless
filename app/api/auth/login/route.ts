import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

// Random string generator for PKCE challenge and state using base64url
function generateRandomString(length: number) {
  return crypto.randomBytes(length).toString('base64url').slice(0, length);
}

function generateCodeChallenge(codeVerifier: string) {
  return crypto.createHash('sha256').update(codeVerifier).digest('base64url');
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

  // 2. Generate PKCE code verifier and challenge
  const codeVerifier = generateRandomString(64);
  const codeChallenge = generateCodeChallenge(codeVerifier);
  
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
  // Using standard OIDC scopes for Customer Account API
  authorizationUrl.searchParams.append('scope', 'openid email');
  authorizationUrl.searchParams.append('state', state);
  authorizationUrl.searchParams.append('nonce', nonce);
  authorizationUrl.searchParams.append('code_challenge', codeChallenge);
  authorizationUrl.searchParams.append('code_challenge_method', 'S256');

  return NextResponse.redirect(authorizationUrl.toString());
}
