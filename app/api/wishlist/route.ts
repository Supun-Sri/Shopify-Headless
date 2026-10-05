import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getCustomerKey, getStoredWishlist, saveStoredWishlist } from '@/lib/wishlist-server';

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('customer_access_token')?.value;
  const idToken = cookieStore.get('customer_id_token')?.value;

  if (!accessToken && !idToken) {
    return NextResponse.json({ isLoggedIn: false, items: [] });
  }

  const customerKey = getCustomerKey(idToken);
  const items = await getStoredWishlist(customerKey);

  return NextResponse.json({ isLoggedIn: true, items });
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
      const current = await getStoredWishlist(customerKey);
      if (action === 'add' && productId) {
        updated = Array.from(new Set([...current, productId]));
      } else if (action === 'remove' && productId) {
        updated = current.filter((id) => id !== productId && !productId.endsWith('/' + id) && !id.endsWith('/' + productId));
      } else {
        updated = current;
      }
    }

    await saveStoredWishlist(customerKey, updated);

    try {
      revalidatePath('/account/wishlist');
      revalidatePath('/account');
    } catch {}

    return NextResponse.json({ success: true, items: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
