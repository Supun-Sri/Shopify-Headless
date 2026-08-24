import { getCollections } from '@/lib/shopify-api';
import HeaderClient from './HeaderClient';
import type { ShopifyCollection } from '@/lib/types';

// Server component: fetches real collections from Shopify and passes them to the client header
export default async function Header() {
  let collections: ShopifyCollection[] = [];
  try {
    collections = await getCollections(30);
  } catch {
    // Fail silently — header still renders without collections
  }
  return <HeaderClient collections={collections} />;
}
