import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getCollections } from '@/lib/shopify-api';
import type { ShopifyCollection } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Collections',
  description: 'Browse Imperial product categories. Construction chemicals, building materials, tools and more.',
};

export default async function CollectionsPage() {
  let collections: ShopifyCollection[] = [];

  try {
    collections = await getCollections(20);
  } catch (error) {
    console.error('Error fetching collections:', error);
  }

  return (
    <>
      <div className="breadcrumb">
        <a href="/">Home</a> / Collections
      </div>
      <div className="section">
        <h2>All Collections</h2>

        {collections.length > 0 ? (
          <div className="catgrid">
            {collections.map((collection) => (
              <Link
                key={collection.id}
                href={`/products?collection=${collection.handle}`}
                className="cattile"
              >
                <div style={{ height: '100px', position: 'relative', overflow: 'hidden', borderRadius: 'var(--r-ctrl)', marginBottom: '10px', background: 'var(--chrome)' }}>
                  {collection.image ? (
                    <Image
                      src={collection.image.url}
                      alt={collection.image.altText || collection.title}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: '28px' }}>📦</span>
                  )}
                </div>
                <span>{collection.title}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="error-page" style={{ minHeight: '40vh' }}>
            <h2>No Collections Available</h2>
            <p>Connect your Shopify store or check back soon for product collections.</p>
          </div>
        )}
      </div>
    </>
  );
}
