import type { Metadata } from 'next';
import { getAllProducts, getCollectionProducts, getProductFilters } from '@/lib/shopify-api';
import type { SortKey } from '@/lib/types';
import ProductCard from '@/components/products/ProductCard';
import PLPFilters from '@/components/products/PLPFilters';
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
        <div key={i} className="skeleton skeleton-card" />
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
      // Build query string with all active filters
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

    // Client-side filter for vendor/type/tags when browsing a collection
    // (collection queries don't support arbitrary query strings)
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
        <div className="error-page" style={{ minHeight: '40vh' }}>
          <h2>No Products Found</h2>
          <p>Try adjusting your filters or <Link href="/products">browse all products</Link>.</p>
        </div>
      );
    }

    return (
      <>
        <div className="plp-toolbar">
          <span className="plp-count">{products.length} product{products.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="prodgrid">
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} priority={i < 4} />
          ))}
        </div>
      </>
    );
  } catch (err) {
    console.error('ProductGrid error:', err);
    return (
      <div className="error-page" style={{ minHeight: '40vh' }}>
        <h2>Products</h2>
        <p>Could not load products. Please check your Shopify connection.</p>
      </div>
    );
  }
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  // Normalise tag param — could be string or string[]
  const tags = params.tag
    ? Array.isArray(params.tag) ? params.tag : [params.tag]
    : [];

  // Fetch filter data and product grid in parallel
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
        <a href="/">Home</a>
        {params.collection
          ? <> / <a href="/collections">Collections</a> / {collectionTitle}</>
          : <> / {collectionTitle}</>
        }
      </div>

      <div className="plp-wrap">
        {/* Real filter sidebar */}
        <Suspense fallback={<div className="plp-filters plp-filters-skeleton" />}>
          <PLPFilters
            filters={filters}
            currentSort={params.sort || ''}
            currentVendor={params.vendor || ''}
            currentType={params.type || ''}
          />
        </Suspense>

        {/* Product grid */}
        <main className="plp-main">
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
