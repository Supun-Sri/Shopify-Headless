import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getCustomerKey, getStoredWishlist, saveStoredWishlist } from '@/lib/wishlist-server';

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

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('customer_access_token')?.value;
  const idToken = cookieStore.get('customer_id_token')?.value;

  if (!accessToken && !idToken) {
    return NextResponse.json({ isLoggedIn: false, items: [] });
  }

  const customerKey = getCustomerKey(idToken);
  const serverItems = getStoredWishlist(customerKey);
  const customerCookieItems = parseCookie(cookieStore.get('customer_wishlist_' + customerKey)?.value);
  const sessionCookieItems = parseCookie(cookieStore.get('wishlist_items')?.value);

  const combined = Array.from(new Set([...serverItems, ...customerCookieItems, ...sessionCookieItems]));
  if (combined.length > serverItems.length) {
    saveStoredWishlist(customerKey, combined);
  }

  return NextResponse.json({ isLoggedIn: true, items: combined });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('customer_access_token')?.value;
  const idToken = cookieStore.get('customer_id_token')?.value;

  if (!accessToken && !idToken) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { productId, action, items } = body;
    const customerKey = getCustomerKey(idToken);

    let updated: string[] = [];
    if (Array.isArray(items)) {
      updated = Array.from(new Set(items));
    } else {
      const current = getStoredWishlist(customerKey);
      if (action === 'add' && productId) {
        updated = Array.from(new Set([...current, productId]));
      } else if (action === 'remove' && productId) {
        updated = current.filter((id) => id !== productId && !productId.endsWith('/' + id) && !id.endsWith('/' + productId));
      } else {
        updated = current;
      }
    }

    saveStoredWishlist(customerKey, updated);
    const serialized = JSON.stringify(updated);

    cookieStore.set('customer_wishlist_' + customerKey, serialized, {
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

    try {
      revalidatePath('/account/wishlist');
      revalidatePath('/account');
    } catch {}

    return NextResponse.json({ success: true, items: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
