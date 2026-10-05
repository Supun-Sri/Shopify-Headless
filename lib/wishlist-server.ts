/**
 * Wishlist & Cart Server Persistence — MongoDB
 *
 * Persists wishlist data and the user's active Cart ID to MongoDB Atlas.
 * This completely decouples persistence from Shopify's admin API requirements
 * and works securely across devices.
 */

import { cookies } from 'next/headers';
import { decodeIdToken } from './shopify-customer';
import { getDb } from './mongodb';

// ─── Customer Key Derivation ─────────────────────────────────────────────────

export function getCustomerKey(idToken?: string): string {
  if (!idToken) return 'default';
  const decoded = decodeIdToken(idToken);
  if (decoded?.sub) return decoded.sub.replace(/[^a-zA-Z0-9]/g, '_');
  if (decoded?.email) return decoded.email.replace(/[^a-zA-Z0-9]/g, '_');
  return 'default';
}

// ─── Cookie Helpers (fallback & sync) ────────────────────────────────────────

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

async function getCookieWishlist(customerKey: string): Promise<string[]> {
  try {
    const cookieStore = await cookies();
    const customerCookie = `customer_wishlist_${customerKey}`;
    const fromCustomer = parseCookie(cookieStore.get(customerCookie)?.value);
    const fromSession = parseCookie(cookieStore.get('wishlist_items')?.value);
    return Array.from(new Set([...fromCustomer, ...fromSession]));
  } catch {
    return [];
  }
}

async function setCookieWishlist(customerKey: string, items: string[]): Promise<void> {
  try {
    const cookieStore = await cookies();
    const deduped = Array.from(new Set(items));
    const serialized = JSON.stringify(deduped);
    cookieStore.set(`customer_wishlist_${customerKey}`, serialized, {
      path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax', httpOnly: false,
    });
    cookieStore.set('wishlist_items', serialized, {
      path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax', httpOnly: false,
    });
  } catch (e) {
    console.error('Failed to save wishlist cookie:', e);
  }
}

// ─── MongoDB Operations ──────────────────────────────────────────────────────

export async function getStoredWishlist(customerKey: string): Promise<string[]> {
  if (!customerKey || customerKey === 'default') return [];

  try {
    if (!process.env.MONGODB_URI) {
      console.warn('[MongoDB] Skipped read: MONGODB_URI is not set. Falling back to cookies.');
      return getCookieWishlist(customerKey);
    }
    
    console.log(`[MongoDB] Fetching wishlist for customer: ${customerKey}`);
    const db = await getDb();
    const doc = await db.collection('customers').findOne({ _id: customerKey as any });
    
    const dbItems = doc?.wishlist || [];
    console.log(`[MongoDB] Found ${dbItems.length} wishlist items in DB for ${customerKey}`);
    
    const cookieItems = await getCookieWishlist(customerKey);

    // Merge both sources so nothing is lost
    const merged = Array.from(new Set([...dbItems, ...cookieItems]));

    // If cookie had items not yet in the DB, sync them up to the DB
    if (merged.length > dbItems.length) {
      console.log(`[MongoDB] Syncing ${merged.length - dbItems.length} new cookie items up to DB.`);
      await saveStoredWishlist(customerKey, merged);
    } else if (merged.length > cookieItems.length) {
      // If DB had items not in the cookie, sync them down to the cookie
      await setCookieWishlist(customerKey, merged);
    }

    return merged;
  } catch (err) {
    console.warn('[MongoDB] Read failed, falling back to cookies:', err);
    return getCookieWishlist(customerKey);
  }
}

export async function saveStoredWishlist(customerKey: string, items: string[]): Promise<void> {
  if (!customerKey || customerKey === 'default') return;

  const deduped = Array.from(new Set(items));
  
  // Always update cookies for fast UI rendering
  await setCookieWishlist(customerKey, deduped);

  // Persist to MongoDB
  try {
    if (!process.env.MONGODB_URI) {
      console.warn('[MongoDB] Skipped write: MONGODB_URI is not set.');
      return;
    }
    
    console.log(`[MongoDB] Upserting wishlist (${deduped.length} items) for customer: ${customerKey}`);
    const db = await getDb();
    const result = await db.collection('customers').updateOne(
      { _id: customerKey as any },
      { $set: { wishlist: deduped, updatedAt: new Date() } },
      { upsert: true }
    );
    console.log(`[MongoDB] Upsert successful! Matched: ${result.matchedCount}, Upserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}`);
  } catch (err) {
    console.error('[MongoDB] Write failed:', err);
  }
}

// ─── Cart Persistence (MongoDB) ──────────────────────────────────────────────

export async function getStoredCartId(customerKey: string): Promise<string | null> {
  if (!customerKey || customerKey === 'default') return null;
  try {
    if (!process.env.MONGODB_URI) return null;
    const db = await getDb();
    const doc = await db.collection('customers').findOne({ _id: customerKey as any });
    if (doc?.cartId) {
      console.log(`[MongoDB] Retrieved saved cart ID for ${customerKey}`);
    }
    return doc?.cartId || null;
  } catch (err) {
    console.error('[MongoDB] Cart read failed:', err);
    return null;
  }
}

export async function saveStoredCartId(customerKey: string, cartId: string): Promise<void> {
  if (!customerKey || customerKey === 'default' || !cartId) return;
  try {
    if (!process.env.MONGODB_URI) {
      console.warn('[MongoDB] Skipped cart write: MONGODB_URI is not set.');
      return;
    }
    
    console.log(`[MongoDB] Saving active cart ID for customer: ${customerKey}`);
    const db = await getDb();
    await db.collection('customers').updateOne(
      { _id: customerKey as any },
      { $set: { cartId, cartUpdatedAt: new Date() } },
      { upsert: true }
    );
    console.log(`[MongoDB] Cart ID saved successfully!`);
  } catch (err) {
    console.error('[MongoDB] Failed to save cart ID:', err);
  }
}
