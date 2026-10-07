import { getCollections, getProductFilters } from '@/lib/shopify-api';
import HeaderClient from './HeaderClient';
import type { ShopifyCollection } from '@/lib/types';

/** Title-case a Shopify product type for nav display */
function formatTypeLabel(type: string): string {
  return type
    .toLowerCase()
    .split(' ')
    .map((w) => (w === '&' ? '&' : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}

// Server component: fetches catalog nav data from Shopify and passes to the client header
export default async function Header() {
  let collections: ShopifyCollection[] = [];
  let vendors: string[] = [];
  try {
    const [collectionsData, filtersData] = await Promise.all([
      getCollections(30),
      getProductFilters(),
    ]);
    vendors = filtersData.vendors;

    // Product types are the real taxonomy (Shopify collections are often empty).
    // Surface types in the Collections menu so clicks show matching products.
    if (filtersData.productTypes.length > 0) {
      collections = filtersData.productTypes.map((type) => ({
        id: `type:${type}`,
        title: formatTypeLabel(type),
        handle: type, // HeaderClient links via ?type=
        description: '',
        image: null,
      }));
    } else {
      collections = collectionsData;
    }
  } catch {
    // Fail silently — header still renders without collections/vendors
  }
  return <HeaderClient collections={collections} vendors={vendors} useTypeLinks />;
}
