import { getCollections, getProductFilters } from '@/lib/shopify-api';
import HeaderClient from './HeaderClient';
import type { ShopifyCollection } from '@/lib/types';

// Server component: fetches real collections and vendors from Shopify and passes them to the client header
export default async function Header() {
  let collections: ShopifyCollection[] = [];
  let vendors: string[] = [];
  try {
    const [collectionsData, filtersData] = await Promise.all([
      getCollections(30),
      getProductFilters()
    ]);
    collections = collectionsData;
    vendors = filtersData.vendors;
  } catch {
    // Fail silently — header still renders without collections/vendors
  }
  return <HeaderClient collections={collections} vendors={vendors} />;
}
