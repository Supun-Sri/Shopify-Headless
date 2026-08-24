'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import type { ProductFilters } from '@/lib/shopify-api';

interface PLPFiltersProps {
  filters: ProductFilters;
  currentSort: string;
  currentVendor: string;
  currentType: string;
}

export default function PLPFilters({ filters, currentSort, currentVendor, currentType }: PLPFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateParam = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== '') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }, [router, pathname, searchParams]);

  const handleSort = (e: React.ChangeEvent<HTMLSelectElement>) => updateParam('sort', e.target.value);
  const handleVendor = (vendor: string, checked: boolean) => updateParam('vendor', checked ? vendor : null);
  const handleType = (type: string, checked: boolean) => updateParam('type', checked ? type : null);
  const handleTag = (tag: string, checked: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    const existing = params.getAll('tag');
    if (checked) {
      params.append('tag', tag);
    } else {
      params.delete('tag');
      existing.filter((t) => t !== tag).forEach((t) => params.append('tag', t));
    }
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };
  const handleMinPrice = (e: React.ChangeEvent<HTMLInputElement>) => updateParam('minPrice', e.target.value);
  const handleMaxPrice = (e: React.ChangeEvent<HTMLInputElement>) => updateParam('maxPrice', e.target.value);
  const handleClear = () => {
    const params = new URLSearchParams();
    if (searchParams.get('collection')) params.set('collection', searchParams.get('collection')!);
    if (searchParams.get('q')) params.set('q', searchParams.get('q')!);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  const activeTags = searchParams.getAll('tag');
  const currentMin = searchParams.get('minPrice') || '';
  const currentMax = searchParams.get('maxPrice') || '';
  const hasFilters = currentVendor || currentType || activeTags.length > 0 || currentMin || currentMax;

  return (
    <aside className={`plp-filters${isPending ? ' plp-filters-loading' : ''}`}>
      <div className="plp-filter-header">
        <span className="plp-filter-title">Filters</span>
        {hasFilters && (
          <button className="plp-filter-clear" onClick={handleClear} type="button">
            Clear all
          </button>
        )}
      </div>

      {/* Sort — also in sidebar for mobile */}
      <div className="filter-group">
        <h6>Sort By</h6>
        <select value={currentSort} onChange={handleSort} className="filter-select" aria-label="Sort products">
          <option value="">Best Match</option>
          <option value="best-selling">Best Selling</option>
          <option value="newest">Newest First</option>
          <option value="price-asc">Price: Low → High</option>
          <option value="price-desc">Price: High → Low</option>
        </select>
      </div>

      {/* Vendors / Brands */}
      {filters.vendors.length > 0 && (
        <div className="filter-group">
          <h6>Brand</h6>
          <div className="filter-group-opts">
            {filters.vendors.map((vendor) => (
              <label key={vendor} className="filter-label">
                <input
                  type="checkbox"
                  checked={currentVendor === vendor}
                  onChange={(e) => handleVendor(vendor, e.target.checked)}
                />
                {vendor}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Product Types */}
      {filters.productTypes.length > 0 && (
        <div className="filter-group">
          <h6>Category</h6>
          <div className="filter-group-opts">
            {filters.productTypes.map((type) => (
              <label key={type} className="filter-label">
                <input
                  type="checkbox"
                  checked={currentType === type}
                  onChange={(e) => handleType(type, e.target.checked)}
                />
                {type}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {filters.tags.length > 0 && (
        <div className="filter-group">
          <h6>Attributes</h6>
          <div className="filter-group-opts">
            {filters.tags.map((tag) => (
              <label key={tag} className="filter-label">
                <input
                  type="checkbox"
                  checked={activeTags.includes(tag)}
                  onChange={(e) => handleTag(tag, e.target.checked)}
                />
                {tag}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div className="filter-group">
        <h6>Price ({filters.currency})</h6>
        <div className="filter-group-opts">
          <div className="filter-price-row">
            <input
              type="number"
              placeholder={`${filters.minPrice}`}
              value={currentMin}
              onChange={handleMinPrice}
              min={0}
              className="filter-price-input"
              aria-label="Minimum price"
            />
            <span className="filter-price-sep">–</span>
            <input
              type="number"
              placeholder={`${filters.maxPrice}`}
              value={currentMax}
              onChange={handleMaxPrice}
              min={0}
              className="filter-price-input"
              aria-label="Maximum price"
            />
          </div>
          <div className="filter-price-hint">
            Range: {filters.currency} {filters.minPrice.toLocaleString()} – {filters.maxPrice.toLocaleString()}
          </div>
        </div>
      </div>
    </aside>
  );
}
