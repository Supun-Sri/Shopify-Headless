/**
 * Wishlist Server Persistence
 *
 * Uses cookies as the durable persistence layer instead of the filesystem.
 * This works correctly on Netlify/Vercel where serverless functions have
 * NO persistent filesystem — files written via fs are wiped on every
 * deploy and cold start.
 *
 * The persistence chain is:
 *   1. Client: Zustand + localStorage (instant, optimistic UI)
 *   2. Server: customer-specific cookie `customer_wishlist_{key}` (durable across requests)
 *   3. Server: session cookie `wishlist_items` (backup/fallback)
 */

import { cookies } from 'next/headers';
import { decodeIdToken } from './shopify-customer';

// ─── Customer Key Derivation ─────────────────────────────────────────────────

export function getCustomerKey(idToken?: string): string {
  if (!idToken) return 'default';
  const decoded = decodeIdToken(idToken);
  if (decoded?.sub) return decoded.sub.replace(/[^a-zA-Z0-9]/g, '_');
  if (decoded?.email) return decoded.email.replace(/[^a-zA-Z0-9]/g, '_');
  return 'default';
}

// ─── Cookie Parsing ──────────────────────────────────────────────────────────

function parseCookie(cookieVal?: string): string[] {
  if (!cookieVal) return [];
  try {
    let raw = cookieVal;
    if (raw.includes('%')) {
      try { raw = decodeURIComponent(raw); } catch {}
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {}
  try {
    const parsed = JSON.parse(cookieVal);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {}
  return [];
}

// ─── Read / Write via Cookies ────────────────────────────────────────────────

export async function getStoredWishlist(customerKey: string): Promise<string[]> {
  if (!customerKey || customerKey === 'default') return [];
  try {
    const cookieStore = await cookies();
    const customerCookie = `customer_wishlist_${customerKey}`;
    const fromCustomer = parseCookie(cookieStore.get(customerCookie)?.value);
    const fromSession = parseCookie(cookieStore.get('wishlist_items')?.value);
    // Merge both sources so nothing is ever lost
    return Array.from(new Set([...fromCustomer, ...fromSession]));
  } catch {
    return [];
  }
}

export async function saveStoredWishlist(customerKey: string, items: string[]): Promise<void> {
  if (!customerKey || customerKey === 'default') return;
  try {
    const cookieStore = await cookies();
    const deduped = Array.from(new Set(items));
    const serialized = JSON.stringify(deduped);
    const customerCookie = `customer_wishlist_${customerKey}`;

    cookieStore.set(customerCookie, serialized, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      httpOnly: false,
    });

    cookieStore.set('wishlist_items', serialized, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      httpOnly: false,
    });
  } catch (e) {
    console.error('Failed to save customer wishlist cookie:', e);
  }
}
