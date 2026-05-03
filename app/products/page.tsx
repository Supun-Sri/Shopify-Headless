import type { Metadata } from 'next';
import { getAllProducts, getCollectionProducts } from '@/lib/shopify-api';
import type { SortKey } from '@/lib/types';
import ProductCard from '@/components/products/ProductCard';
import { Suspense } from 'react';
import { ProductGridSkeleton } from '@/components/ui/SkeletonLoader';
import ProductFilters from '@/components/products/ProductFilters';

export const metadata: Metadata = {
  title: 'Collections',
  description: 'Browse the MZILLA  collection. Timeless luxury essentials crafted with architectural precision.',
};

interface PageProps {
  searchParams: Promise<{ sort?: string; q?: string; minPrice?: string; maxPrice?: string; collection?: string }>;
}

function getSortVariables(sort?: string): { sortKey: SortKey; reverse: boolean } {
  switch (sort) {
    case 'price-asc': return { sortKey: 'PRICE', reverse: false };
    case 'price-desc': return { sortKey: 'PRICE', reverse: true };
    case 'newest': return { sortKey: 'CREATED_AT', reverse: true };
    case 'best-selling': return { sortKey: 'BEST_SELLING', reverse: false };
    default: return { sortKey: 'RELEVANCE', reverse: false };
  }
}

async function ProductGrid({ sort, q, minPrice, maxPrice, collection }: { sort?: string; q?: string; minPrice?: string; maxPrice?: string; collection?: string }) {
  try {
    // If collection is specified, fetch products from that collection
    if (collection) {
      const { sortKey, reverse } = getSortVariables(sort);
      const { products } = await getCollectionProducts(collection, { first: 24, sortKey, reverse });

      if (products.length === 0) {
        return (
          <div className="error-page" style={{ minHeight: '40vh' }}>
            <h2 className="text-headline-lg">No Products Found</h2>
            <p>This collection is empty or doesn&apos;t exist.</p>
          </div>
        );
      }

      return (
        <>
          <div className="filter-bar">
            <span className="filter-count">{products.length} pieces</span>
          </div>
          <div className="products-grid">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} priority={i < 4} />
            ))}
          </div>
        </>
      );
    }

    // Otherwise, fetch all products with filters
    const { sortKey, reverse } = getSortVariables(sort);

    const queryParts: string[] = [];
    if (q) queryParts.push(`title:${q}*`);
    if (minPrice) queryParts.push(`variants.price:>=${minPrice}`);
    if (maxPrice) queryParts.push(`variants.price:<=${maxPrice}`);
    
    const finalQuery = queryParts.length > 0 ? queryParts.join(' AND ') : undefined;

    const { products } = await getAllProducts({ first: 24, sortKey, reverse, query: finalQuery });

    if (products.length === 0) {
      return (
        <div className="error-page" style={{ minHeight: '40vh' }}>
          <h2 className="text-headline-lg">No Products Found</h2>
          <p>We couldn&apos;t find any products matching your criteria.</p>
        </div>
      );
    }

    return (
      <>
        <div className="filter-bar">
          <span className="filter-count">{products.length} pieces</span>
        </div>
        <div className="products-grid">
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} priority={i < 4} />
          ))}
        </div>
      </>
    );
  } catch {
    return (
      <div className="error-page" style={{ minHeight: '40vh' }}>
        <h2 className="text-headline-lg">The Archive</h2>
        <p>Connect your Shopify store to browse products. Add your credentials to .env.local to get started.</p>
      </div>
    );
  }
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <div className="section" style={{ marginTop: '48px', marginBottom: '128px' }}>
      <div className="section-header">
        <h1 className="text-headline-lg" style={{ fontFamily: 'var(--font-serif)' }}>
          {params.collection ? params.collection.charAt(0).toUpperCase() + params.collection.slice(1).replace(/-/g, ' ') : 'PRODUCTS'}
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-grey)', textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: '8px' }}>
          {params.collection ? 'Curated selection' : 'The complete archive'}
        </p>
      </div>

      <ProductFilters />

      <Suspense fallback={<ProductGridSkeleton count={8} />}>
        <ProductGrid sort={params.sort} q={params.q} minPrice={params.minPrice} maxPrice={params.maxPrice} collection={params.collection} />
      </Suspense>
    </div>
  );
}
