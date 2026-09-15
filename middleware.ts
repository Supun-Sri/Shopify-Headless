import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for transparent auth token refresh.
 * Intercepts requests to /account/* routes and checks if the access token
 * is missing but a refresh token exists. If so, redirects through the
 * refresh endpoint to obtain a new token transparently.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect account routes
  if (!pathname.startsWith('/account')) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('customer_access_token')?.value;
  const refreshToken = request.cookies.get('customer_refresh_token')?.value;
  const loggedInIndicator = request.cookies.get('customer_logged_in')?.value;

  // If access token exists, allow through
  if (accessToken) {
    return NextResponse.next();
  }

  // If no access token but refresh token exists, attempt transparent refresh
  if (refreshToken) {
    const refreshUrl = new URL('/api/auth/refresh', request.url);
    refreshUrl.searchParams.set('returnTo', pathname + request.nextUrl.search);
    return NextResponse.redirect(refreshUrl);
  }

  // If the logged-in indicator is still set but tokens are gone, clean it up
  if (loggedInIndicator) {
    const response = NextResponse.redirect(new URL('/api/auth/login', request.url));
    response.cookies.delete('customer_logged_in');
    return response;
  }

  // No tokens at all — redirect to login
  return NextResponse.redirect(new URL('/api/auth/login', request.url));
}

export const config = {
  matcher: ['/account/:path*'],
};
