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

const PRODUCTS_PER_PAGE = 12;

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
    after?: string; // Shopify cursor for next-page pagination
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

/** Build a URL preserving all current search params, overriding specific keys */
function buildUrl(base: Record<string, string | undefined>, overrides: Record<string, string | undefined>): string {
  const merged = { ...base, ...overrides };
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v !== undefined && v !== '') params.set(k, v);
  }
  const qs = params.toString();
  return `/products${qs ? `?${qs}` : ''}`;
}

function ProductGridSkeleton() {
  return (
    <div className="prodgrid">
      {Array.from({ length: PRODUCTS_PER_PAGE }).map((_, i) => (
        <div key={i} className="card" style={{ height: '300px', background: 'var(--slot)' }} />
      ))}
    </div>
  );
}

async function ProductGrid({
  sort, q, minPrice, maxPrice, collection, vendor, type, tags, after, baseParams,
}: {
  sort?: string; q?: string; minPrice?: string; maxPrice?: string;
  collection?: string; vendor?: string; type?: string; tags?: string[];
  after?: string;
  baseParams: Record<string, string | undefined>;
}) {
  try {
    const { sortKey, reverse } = getSortVariables(sort);
    let products;
    let pageInfo: { hasNextPage: boolean; endCursor: string | null };

    if (collection) {
      const result = await getCollectionProducts(collection, {
        first: PRODUCTS_PER_PAGE,
        after,
        sortKey,
        reverse,
      });
      products = result.products;
      pageInfo = result.pageInfo;

      // Client-side filters when browsing a collection
      if (vendor) products = products.filter((p) => p.vendor === vendor);
      if (type) products = products.filter((p) => p.productType === type);
      if (tags && tags.length > 0) {
        products = products.filter((p) => tags.every((t) => p.tags.includes(t)));
      }
      if (minPrice) products = products.filter((p) => parseFloat(p.priceRange.minVariantPrice.amount) >= parseFloat(minPrice));
      if (maxPrice) products = products.filter((p) => parseFloat(p.priceRange.minVariantPrice.amount) <= parseFloat(maxPrice));
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
      const result = await getAllProducts({
        first: PRODUCTS_PER_PAGE,
        after,
        sortKey,
        reverse,
        query: finalQuery,
      });
      products = result.products;
      pageInfo = result.pageInfo;
    }

    if (products.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
          <h2 style={{ fontSize: '20px', color: 'var(--navy)', marginBottom: '12px' }}>No Products Found</h2>
          <p style={{ marginBottom: '24px' }}>Try adjusting your filters or search query.</p>
          <Link href="/products" className="btn secondary">Reset Filters</Link>
        </div>
      );
    }

    const isFirstPage = !after;
    const prevUrl = isFirstPage ? null : buildUrl(baseParams, { after: undefined });
    const nextUrl = pageInfo.hasNextPage && pageInfo.endCursor
      ? buildUrl(baseParams, { after: pageInfo.endCursor })
      : null;

    return (
      <>
        <PLPToolbar totalCount={products.length} currentSort={sort || ''} />
        <div className="prodgrid">
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} priority={i < 4} />
          ))}
        </div>

        {/* Pagination — cursor-based, driven by URL */}
        {(prevUrl || nextUrl) && (
          <div className="pagerow">
            <div className="pager">
              {prevUrl ? (
                <Link href={prevUrl} className="pg nav" aria-label="Previous page">
                  <svg className="ic sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                  <span style={{ fontSize: '12px', marginLeft: '4px' }}>Prev</span>
                </Link>
              ) : (
                <span className="pg nav" style={{ opacity: 0.3 }} aria-disabled="true">
                  <svg className="ic sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </span>
              )}

              <span className="pg active" style={{ cursor: 'default' }}>
                {isFirstPage ? 'Page 1' : '···'}
              </span>

              {nextUrl ? (
                <Link href={nextUrl} className="pg nav" aria-label="Next page">
                  <span style={{ fontSize: '12px', marginRight: '4px' }}>Next</span>
                  <svg className="ic sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </Link>
              ) : (
                <span className="pg nav" style={{ opacity: 0.3 }} aria-disabled="true">
                  <svg className="ic sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </span>
              )}
            </div>
          </div>
        )}
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

  // Snapshot of all current search params (excluding `after` — handled separately by pagination links)
  const baseParams: Record<string, string | undefined> = {
    sort: params.sort,
    q: params.q,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    collection: params.collection,
    vendor: params.vendor,
    type: params.type,
  };
  if (tags.length > 0) baseParams.tag = tags[0];

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
              after={params.after}
              baseParams={baseParams}
            />
          </Suspense>
        </main>
      </div>
    </>
  );
}
