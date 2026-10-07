import type { Metadata } from 'next';
import { getAllProducts, getCollectionProducts, getProductFilters } from '@/lib/shopify-api';
import type { CollectionSortKey, SortKey } from '@/lib/types';
import { buildCollectionFallbackQuery } from '@/lib/utils';
import { planProductSearch } from '@/lib/product-search';
import ProductCard from '@/components/products/ProductCard';
import PLPFilters from '@/components/products/PLPFilters';
import PLPToolbar from '@/components/products/PLPToolbar';
import { Suspense } from 'react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Products',
  description: 'Browse IMPERIAL construction chemicals, building materials, tools and equipment. UAE stocked, project ready.',
};

const PRODUCTS_PER_PAGE = 24;

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
    page?: string;  // numeric page number for display
  }>;
}

/**
 * Map UI sort params to Shopify sort keys.
 * Collection queries use ProductCollectionSortKeys (CREATED, not CREATED_AT;
 * RELEVANCE is invalid without a search query — use COLLECTION_DEFAULT / BEST_SELLING).
 */
function getSortVariables(
  sort?: string,
  forCollection = false,
  hasSearchQuery = false
): { sortKey: SortKey | CollectionSortKey; reverse: boolean } {
  switch (sort) {
    case 'price-asc':
      return { sortKey: 'PRICE', reverse: false };
    case 'price-desc':
      return { sortKey: 'PRICE', reverse: true };
    case 'newest':
      return { sortKey: forCollection ? 'CREATED' : 'CREATED_AT', reverse: true };
    case 'best-selling':
      return { sortKey: 'BEST_SELLING', reverse: false };
    default:
      // RELEVANCE is valid with a search query; never use it on bare collection queries
      if (forCollection) return { sortKey: 'COLLECTION_DEFAULT', reverse: false };
      if (hasSearchQuery) return { sortKey: 'RELEVANCE', reverse: false };
      return { sortKey: 'BEST_SELLING', reverse: false };
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

function buildFilterParts(opts: {
  vendor?: string;
  type?: string;
  tags?: string[];
  minPrice?: string;
  maxPrice?: string;
}): string[] {
  const parts: string[] = [];
  if (opts.vendor) parts.push(`vendor:"${opts.vendor}"`);
  if (opts.type) parts.push(`product_type:"${opts.type}"`);
  if (opts.tags && opts.tags.length > 0) {
    opts.tags.forEach((tag) => parts.push(`tag:"${tag}"`));
  }
  if (opts.minPrice) parts.push(`variants.price:>=${opts.minPrice}`);
  if (opts.maxPrice) parts.push(`variants.price:<=${opts.maxPrice}`);
  return parts;
}

async function ProductGrid({
  sort, q, minPrice, maxPrice, collection, vendor, type, tags, after, baseParams, pageNum,
  searchDict,
}: {
  sort?: string; q?: string; minPrice?: string; maxPrice?: string;
  collection?: string; vendor?: string; type?: string; tags?: string[];
  after?: string;
  baseParams: Record<string, string | undefined>;
  pageNum: number;
  searchDict: string[];
}) {
  try {
    let products;
    let pageInfo: { hasNextPage: boolean; endCursor: string | null };

    if (collection) {
      const { sortKey, reverse } = getSortVariables(sort, true, Boolean(q));
      const result = await getCollectionProducts(collection, {
        first: PRODUCTS_PER_PAGE,
        after,
        sortKey,
        reverse,
      });
      products = result.products;
      pageInfo = result.pageInfo;

      // Shopify collections in this store are often empty shells — products are
      // categorized by productType instead. Fall back to a type/title search.
      if (products.length === 0) {
        const searchPlan = q ? planProductSearch(q, searchDict) : null;
        const { sortKey: productSortKey, reverse: productReverse } = getSortVariables(
          sort,
          false,
          Boolean(q)
        );
        const queryParts: string[] = [`(${buildCollectionFallbackQuery(collection)})`];
        queryParts.push(...buildFilterParts({ vendor, type, tags, minPrice, maxPrice }));
        if (searchPlan) queryParts.push(searchPlan.primary);

        const fallback = await getAllProducts({
          first: PRODUCTS_PER_PAGE,
          after,
          sortKey: productSortKey,
          reverse: productReverse,
          query: queryParts.join(' AND '),
        });
        products = fallback.products;
        pageInfo = fallback.pageInfo;
      } else {
        // Client-side filters when using real collection membership
        if (vendor) products = products.filter((p) => p.vendor === vendor);
        if (type) products = products.filter((p) => p.productType === type);
        if (tags && tags.length > 0) {
          products = products.filter((p) => tags.every((t) => p.tags.includes(t)));
        }
        if (minPrice) products = products.filter((p) => parseFloat(p.priceRange.minVariantPrice.amount) >= parseFloat(minPrice));
        if (maxPrice) products = products.filter((p) => parseFloat(p.priceRange.minVariantPrice.amount) <= parseFloat(maxPrice));
      }
    } else {
      const searchPlan = q ? planProductSearch(q, searchDict) : null;
      const { sortKey, reverse } = getSortVariables(sort, false, Boolean(searchPlan));
      const filterParts = buildFilterParts({ vendor, type, tags, minPrice, maxPrice });

      const primaryQuery = searchPlan
        ? [...filterParts, searchPlan.primary].join(' AND ')
        : filterParts.length > 0
          ? filterParts.join(' AND ')
          : undefined;

      const result = await getAllProducts({
        first: PRODUCTS_PER_PAGE,
        after,
        sortKey,
        reverse,
        query: primaryQuery,
      });
      products = result.products;
      pageInfo = result.pageInfo;

      // Typo / sparse match: retry with a looser clause when primary is empty
      // (skip when paginating — cursor belongs to the primary result set)
      if (products.length === 0 && searchPlan && !after) {
        const looseQuery = [...filterParts, searchPlan.loose].join(' AND ');
        const loose = await getAllProducts({
          first: PRODUCTS_PER_PAGE,
          sortKey,
          reverse,
          query: looseQuery,
        });
        products = loose.products;
        pageInfo = loose.pageInfo;
      }
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
    const prevUrl = isFirstPage ? null : buildUrl(baseParams, { after: undefined, page: String(pageNum - 1) });
    const nextUrl = pageInfo.hasNextPage && pageInfo.endCursor
      ? buildUrl(baseParams, { after: pageInfo.endCursor, page: String(pageNum + 1) })
      : null;

    const pageStart = (pageNum - 1) * PRODUCTS_PER_PAGE + 1;

    return (
      <>
        <PLPToolbar
          totalCount={products.length}
          currentSort={sort || ''}
          pageStart={pageStart}
          hasNextPage={pageInfo.hasNextPage}
        />
        <div className="prodgrid">
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} priority={i < 4} />
          ))}
        </div>

        {/* Pagination — cursor-based, driven by URL */}
        {(prevUrl || nextUrl) && (
          <div className="pagerow" style={{ display: 'flex', justifyContent: 'center', width: '100%', padding: '40px 0 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', width: '100%' }}>
              
              {/* Previous Button */}
              {prevUrl ? (
                <Link href={prevUrl} aria-label="Previous page" style={{ padding: '8px 20px', borderRadius: '6px', display: 'inline-flex', gap: '8px', alignItems: 'center', background: '#5e96b8', color: '#fff', textDecoration: 'none', fontWeight: 500, fontSize: '15px', transition: 'background 0.2s', minWidth: '120px', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 8 8 12 12 16"></polyline>
                    <line x1="16" y1="12" x2="8" y2="12"></line>
                  </svg>
                  Previous
                </Link>
              ) : (
                <span style={{ padding: '8px 20px', borderRadius: '6px', display: 'inline-flex', gap: '8px', alignItems: 'center', background: '#5e96b8', color: '#fff', textDecoration: 'none', fontWeight: 500, fontSize: '15px', opacity: 0.5, cursor: 'not-allowed', minWidth: '120px', justifyContent: 'center' }} aria-disabled="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 8 8 12 12 16"></polyline>
                    <line x1="16" y1="12" x2="8" y2="12"></line>
                  </svg>
                  Previous
                </span>
              )}

              {/* Current Page Indicator */}
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--navy, #333)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Page
                <span style={{ padding: '6px 16px', border: '1px solid #ccc', borderRadius: '4px', background: 'transparent' }}>
                  {pageNum}
                </span>
              </div>

              {/* Next Button */}
              {nextUrl ? (
                <Link href={nextUrl} aria-label="Next page" style={{ padding: '8px 20px', borderRadius: '6px', display: 'inline-flex', gap: '8px', alignItems: 'center', background: '#5e96b8', color: '#fff', textDecoration: 'none', fontWeight: 500, fontSize: '15px', transition: 'background 0.2s', minWidth: '120px', justifyContent: 'center' }}>
                  Next
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 16 16 12 12 8"></polyline>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                  </svg>
                </Link>
              ) : (
                <span style={{ padding: '8px 20px', borderRadius: '6px', display: 'inline-flex', gap: '8px', alignItems: 'center', background: '#5e96b8', color: '#fff', textDecoration: 'none', fontWeight: 500, fontSize: '15px', opacity: 0.5, cursor: 'not-allowed', minWidth: '120px', justifyContent: 'center' }} aria-disabled="true">
                  Next
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 16 16 12 12 8"></polyline>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
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

  // Live catalog terms help fuzzy-correct typos (e.g. "adheisive" → adhesives type)
  const searchDict = [
    ...filters.productTypes,
    ...filters.vendors,
    ...filters.tags,
  ];

  const searchPlan = params.q ? planProductSearch(params.q, searchDict) : null;
  const collectionTitle = params.collection
    ? params.collection.charAt(0).toUpperCase() + params.collection.slice(1).replace(/-/g, ' ')
    : params.type
    ? params.type
        .toLowerCase()
        .split(' ')
        .map((w) => (w === '&' ? '&' : w.charAt(0).toUpperCase() + w.slice(1)))
        .join(' ')
    : params.q
    ? searchPlan && searchPlan.corrected !== params.q.trim().toLowerCase()
      ? `Search: "${params.q}" → ${searchPlan.corrected}`
      : `Search: "${params.q}"`
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

  // Parse page number from URL (defaults to 1 when no cursor is present)
  const pageNum = Math.max(1, parseInt(params.page || '1', 10));

  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link href="/">Home</Link>
        {params.collection || params.type ? (
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
              pageNum={pageNum}
              searchDict={searchDict}
            />
          </Suspense>
        </main>
      </div>
    </>
  );
}
