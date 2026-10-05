import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for account route protection and transparent auth token refresh.
 * Intercepts requests to /account/* routes and checks if the access token
 * is missing but a refresh token exists. If so, redirects through the
 * refresh endpoint to obtain a new token transparently.
 */
export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Skip RSC flight requests — these are internal Next.js fetches for client-side
  // navigation. Redirecting them breaks client-side nav with "Failed to fetch RSC payload".
  const isRscRequest = request.headers.get('RSC') === '1'
    || request.headers.get('Next-Router-State-Tree') !== null
    || request.headers.get('Next-Router-Prefetch') !== null;
  if (isRscRequest) {
    return NextResponse.next();
  }

  // --- ACCOUNT ROUTES PROTECTION ---
  if (pathname.startsWith('/account')) {
    const accessToken = request.cookies.get('customer_access_token')?.value;
    const refreshToken = request.cookies.get('customer_refresh_token')?.value;
    const loggedInIndicator = request.cookies.get('customer_logged_in')?.value;

    if (searchParams.has('error')) {
      return NextResponse.next();
    }

    if (accessToken) {
      return NextResponse.next();
    }

    if (refreshToken) {
      const refreshUrl = new URL('/api/auth/refresh', request.url);
      refreshUrl.searchParams.set('returnTo', pathname + request.nextUrl.search);
      return NextResponse.redirect(refreshUrl);
    }

    if (loggedInIndicator) {
      const redirectResponse = NextResponse.redirect(new URL('/api/auth/login', request.url));
      redirectResponse.cookies.delete('customer_logged_in');
      return redirectResponse;
    }

    return NextResponse.redirect(new URL('/api/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/account/:path*'],
};
