import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('customer_refresh_token')?.value;
  const clientId = process.env.SHOPIFY_CUSTOMER_API_CLIENT_ID;
  const tokenUrl = process.env.SHOPIFY_TOKEN_URL;

  if (!refreshToken || !clientId || !tokenUrl) {
    return NextResponse.json({ error: 'No refresh token available' }, { status: 401 });
  }

  try {
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId,
        refresh_token: refreshToken,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      console.error('Token refresh failed:', errorData);
      // Clear stale cookies — user needs to re-login
      cookieStore.delete('customer_access_token');
      cookieStore.delete('customer_id_token');
      cookieStore.delete('customer_refresh_token');
      cookieStore.delete('customer_logged_in');
      return NextResponse.json({ error: 'Refresh failed', redirectTo: '/api/auth/login' }, { status: 401 });
    }

    const data = await tokenResponse.json();
    const isProduction = process.env.NODE_ENV === 'production';
    const tokenExpiry = data.expires_in || 3600;

    if (data.access_token) {
      cookieStore.set('customer_access_token', data.access_token, {
        httpOnly: true,
        secure: isProduction,
        maxAge: tokenExpiry,
        path: '/',
      });
    }

    if (data.id_token) {
      cookieStore.set('customer_id_token', data.id_token, {
        httpOnly: true,
        secure: isProduction,
        maxAge: tokenExpiry,
        path: '/',
      });
    }

    // Update refresh token if a new one was issued
    if (data.refresh_token) {
      cookieStore.set('customer_refresh_token', data.refresh_token, {
        httpOnly: true,
        secure: isProduction,
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
        sameSite: 'lax',
      });
    }

    // Renew the client-visible indicator
    cookieStore.set('customer_logged_in', '1', {
      httpOnly: false,
      secure: isProduction,
      maxAge: tokenExpiry,
      path: '/',
      sameSite: 'lax',
    });

    const url = new URL(request.url);
    const returnTo = url.searchParams.get('returnTo') || '/account';
    return NextResponse.redirect(new URL(returnTo, url.origin));
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
