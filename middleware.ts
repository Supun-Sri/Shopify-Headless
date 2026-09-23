import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for transparent auth token refresh.
 * Intercepts requests to /account/* routes and checks if the access token
 * is missing but a refresh token exists. If so, redirects through the
 * refresh endpoint to obtain a new token transparently.
 */
export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  const accessToken = request.cookies.get('customer_access_token')?.value;
  const refreshToken = request.cookies.get('customer_refresh_token')?.value;
  const loggedInIndicator = request.cookies.get('customer_logged_in')?.value;
  const firstVisitDate = request.cookies.get('first_visit_date')?.value;

  // --- GUEST ACCESS RESTRICTION LOGIC ---
  const SIX_MONTHS_MS = 180 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  let response = NextResponse.next();

  if (!firstVisitDate) {
    // Set the first visit date for new guests
    response.cookies.set('first_visit_date', now.toString(), {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  } else {
    // Check if 6 months have passed
    const visitDate = parseInt(firstVisitDate, 10);
    if (!isNaN(visitDate) && now - visitDate > SIX_MONTHS_MS) {
      // If 6 months passed and NOT logged in
      if (!accessToken && !refreshToken && !loggedInIndicator) {
        // Prevent redirect loops by only redirecting if not already going to auth
        if (!pathname.startsWith('/api/auth') && !pathname.startsWith('/account')) {
          const authUrl = new URL('/api/auth/login', request.url);
          return NextResponse.redirect(authUrl);
        }
      }
    }
  }

  // --- ACCOUNT ROUTES PROTECTION ---
  if (pathname.startsWith('/account')) {
    if (searchParams.has('error')) {
      return response;
    }

    if (accessToken) {
      return response;
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

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
