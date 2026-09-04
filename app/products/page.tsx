import type { Metadata } from 'next';
import { getAllProducts, getCollectionProducts, getProductFilters } from '@/lib/shopify-api';
import type { SortKey } from '@/lib/types';
import ProductCard from '@/components/products/ProductCard';
import PLPFilters from '@/components/products/PLPFilters';
import PLPToolbar from '@/components/products/PLPToolbar';
import { Suspense } from 'react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Products',
  description: 'Browse IMPERIAL construction chemicals, building materials, tools and equipment. UAE stocked, project ready.',
};

interface PageProps {
  searchParams: Promise<{
    sort?: string;
    q?: string;
    minPrice?: string;
    maxPrice?: string;
    collection?: string;
    vendor?: string;
    type?: string;
    tag?: string | string[];
  }>;
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

function ProductGridSkeleton() {
  return (
    <div className="prodgrid">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="card" style={{ height: '340px', background: 'var(--slot)' }} />
      ))}
    </div>
  );
}

async function ProductGrid({
  sort, q, minPrice, maxPrice, collection, vendor, type, tags,
}: {
  sort?: string; q?: string; minPrice?: string; maxPrice?: string;
  collection?: string; vendor?: string; type?: string; tags?: string[];
}) {
  try {
    const { sortKey, reverse } = getSortVariables(sort);
    let products;

    if (collection) {
      const result = await getCollectionProducts(collection, { first: 48, sortKey, reverse });
      products = result.products;
    } else {
      const queryParts: string[] = [];
      if (q) queryParts.push(`title:${q}*`);
      if (vendor) queryParts.push(`vendor:"${vendor}"`);
      if (type) queryParts.push(`product_type:"${type}"`);
      if (tags && tags.length > 0) {
        tags.forEach((tag) => queryParts.push(`tag:"${tag}"`));
      }
      if (minPrice) queryParts.push(`variants.price:>=${minPrice}`);
      if (maxPrice) queryParts.push(`variants.price:<=${maxPrice}`);
      const finalQuery = queryParts.length > 0 ? queryParts.join(' AND ') : undefined;
      const result = await getAllProducts({ first: 48, sortKey, reverse, query: finalQuery });
      products = result.products;
    }

    if (collection) {
      if (vendor) products = products.filter((p) => p.vendor === vendor);
      if (type) products = products.filter((p) => p.productType === type);
      if (tags && tags.length > 0) {
        products = products.filter((p) => tags.every((t) => p.tags.includes(t)));
      }
      if (minPrice) products = products.filter((p) => parseFloat(p.priceRange.minVariantPrice.amount) >= parseFloat(minPrice));
      if (maxPrice) products = products.filter((p) => parseFloat(p.priceRange.minVariantPrice.amount) <= parseFloat(maxPrice));
    }

    if (products.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
          <h2 style={{ fontSize: '20px', color: 'var(--navy)', marginBottom: '12px' }}>No Products Found</h2>
          <p style={{ marginBottom: '24px' }}>Try adjusting your filters or search query.</p>
          <Link href="/products" className="btn secondary">
            Reset Filters
          </Link>
        </div>
      );
    }

    return (
      <>
        <PLPToolbar totalCount={products.length} currentSort={sort || ''} />
        <div className="prodgrid">
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} priority={i < 4} />
          ))}
        </div>

        {/* Pager */}
        <div className="pagerow">
          <div className="pager">
            <button className="pg nav" aria-label="Previous page">
              <svg className="ic sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button className="pg active">1</button>
            <button className="pg">2</button>
            <button className="pg">3</button>
            <button className="pg">4</button>
            <button className="pg nav" aria-label="Next page">
              <svg className="ic sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      </>
    );
  } catch (err) {
    console.error('ProductGrid error:', err);
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
        <h2>Products</h2>
        <p>Could not load products. Please check your Shopify connection.</p>
      </div>
    );
  }
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const tags = params.tag
    ? Array.isArray(params.tag) ? params.tag : [params.tag]
    : [];

  const [filters] = await Promise.all([
    getProductFilters(params.collection),
  ]);

  const collectionTitle = params.collection
    ? params.collection.charAt(0).toUpperCase() + params.collection.slice(1).replace(/-/g, ' ')
    : params.q
    ? `Search: "${params.q}"`
    : 'All Products';

  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link href="/">Home</Link>
        {params.collection ? (
          <>
            {' / '}
            <Link href="/products">Products</Link>
            {' / '}
            <span>{collectionTitle}</span>
          </>
        ) : (
          <>
            {' / '}
            <span>{collectionTitle}</span>
          </>
        )}
      </div>

      <div className="plpwrap">
        {/* Filter sidebar */}
        <Suspense fallback={<div className="filters skeleton" style={{ height: '400px' }} />}>
          <PLPFilters
            filters={filters}
            currentSort={params.sort || ''}
            currentVendor={params.vendor || ''}
            currentType={params.type || ''}
          />
        </Suspense>

        {/* Product grid */}
        <main className="plpmain">
          <Suspense fallback={<ProductGridSkeleton />}>
            <ProductGrid
              sort={params.sort}
              q={params.q}
              minPrice={params.minPrice}
              maxPrice={params.maxPrice}
              collection={params.collection}
              vendor={params.vendor}
              type={params.type}
              tags={tags}
            />
          </Suspense>
        </main>
      </div>
    </>
  );
}
