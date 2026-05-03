import type { Metadata } from 'next';
import { getCollections } from '@/lib/shopify-api';
import type { ShopifyCollection } from '@/lib/types';
import CollectionCard from '@/components/collections/CollectionCard';

export const metadata: Metadata = {
  title: 'Collections',
  description: 'Explore our curated collections. Each collection tells a story of craftsmanship and timeless design.',
};

export default async function CollectionsPage() {
  let collections: ShopifyCollection[] = [];
  
  try {
    collections = await getCollections(20);
  } catch (error) {
    console.error('Error fetching collections:', error);
  }

  return (
    <div className="section" style={{ marginTop: '48px', marginBottom: '128px' }}>
      <div className="section-header">
        <h1 className="text-headline-lg" style={{ fontFamily: 'var(--font-serif)' }}>Collections</h1>
        <p style={{ fontSize: '14px', color: 'var(--color-grey)', textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: '8px' }}>
          Curated perspectives on timeless design
        </p>
      </div>

      {collections.length > 0 ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px', marginBottom: '16px' }}>
            <p style={{ fontSize: '11px', color: 'var(--color-grey)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              Scroll to explore →
            </p>
          </div>
          <div className="collections-grid">
            {collections.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
        </>
      ) : (
        <div className="error-page" style={{ minHeight: '40vh' }}>
          <h2 className="text-headline-lg">No Collections Available</h2>
          <p>Check back soon for our curated collections.</p>
        </div>
      )}
    </div>
  );
}
