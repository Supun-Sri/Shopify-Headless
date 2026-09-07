import fs from 'fs';
import path from 'path';
import { decodeIdToken } from './shopify-customer';

const DATA_DIR = path.join(process.cwd(), 'data');
const WISHLIST_FILE = path.join(DATA_DIR, 'customer-wishlists.json');

export function getCustomerKey(idToken?: string): string {
  if (!idToken) return 'default';
  const decoded = decodeIdToken(idToken);
  if (decoded?.sub) return decoded.sub.replace(/[^a-zA-Z0-9]/g, '_');
  if (decoded?.email) return decoded.email.replace(/[^a-zA-Z0-9]/g, '_');
  return 'default';
}

function readAllWishlists(): Record<string, string[]> {
  try {
    if (!fs.existsSync(WISHLIST_FILE)) {
      return {};
    }
    const raw = fs.readFileSync(WISHLIST_FILE, 'utf8');
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

function writeAllWishlists(data: Record<string, string[]>): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(WISHLIST_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save customer wishlist:', e);
  }
}

export function getStoredWishlist(customerKey: string): string[] {
  if (!customerKey || customerKey === 'default') return [];
  const all = readAllWishlists();
  const list = all[customerKey];
  return Array.isArray(list) ? list : [];
}

export function saveStoredWishlist(customerKey: string, items: string[]): void {
  if (!customerKey || customerKey === 'default') return;
  const all = readAllWishlists();
  all[customerKey] = Array.from(new Set(items));
  writeAllWishlists(all);
}
