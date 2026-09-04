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
  const handleMaxPrice = (e: React.ChangeEvent<HTMLInputElement>) => updateParam('maxPrice', e.target.value);
  const handleClear = () => {
    const params = new URLSearchParams();
    if (searchParams.get('collection')) params.set('collection', searchParams.get('collection')!);
    if (searchParams.get('q')) params.set('q', searchParams.get('q')!);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  const activeTags = searchParams.getAll('tag');
  const currentMax = searchParams.get('maxPrice') || '';
  const hasFilters = currentVendor || currentType || activeTags.length > 0 || currentMax;

  return (
    <aside className={`filters plp-filters${isPending ? ' plp-filters-loading' : ''}`}>
      {hasFilters && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
          <button
            onClick={handleClear}
            type="button"
            style={{ background: 'none', border: 'none', color: 'var(--imperial-blue)', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Vendors / Brands */}
      {filters.vendors.length > 0 && (
        <div className="filtergroup">
          <h6>Brand</h6>
          <div className="opts">
            {filters.vendors.map((vendor) => {
              const isChecked = currentVendor === vendor;
              return (
                <label key={vendor} className="check">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => handleVendor(vendor, e.target.checked)}
                  />
                  <span className="box">
                    <svg className="ic sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span>{vendor}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Product Types / Categories */}
      {filters.productTypes.length > 0 && (
        <div className="filtergroup">
          <h6>Category</h6>
          <div className="opts">
            {filters.productTypes.map((type) => {
              const isChecked = currentType === type;
              return (
                <label key={type} className="check">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => handleType(type, e.target.checked)}
                  />
                  <span className="box">
                    <svg className="ic sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span>{type}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Attributes / Tags */}
      {filters.tags.length > 0 && (
        <div className="filtergroup">
          <h6>Attributes</h6>
          <div className="opts">
            {filters.tags.slice(0, 10).map((tag) => {
              const isChecked = activeTags.includes(tag);
              return (
                <label key={tag} className="check">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => handleTag(tag, e.target.checked)}
                  />
                  <span className="box">
                    <svg className="ic sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span>{tag}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Price Range Slider */}
      <div className="filtergroup">
        <h6>Price (AED)</h6>
        <div className="opts rangewrap">
          <input
            type="range"
            min={filters.minPrice || 0}
            max={filters.maxPrice || 10000}
            step={10}
            value={currentMax || filters.maxPrice || 10000}
            onChange={handleMaxPrice}
            aria-label="Maximum price"
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--faint)', marginTop: '6px' }}>
            <span>AED {filters.minPrice || 0}</span>
            <span>AED {currentMax || `${filters.maxPrice || 10000}+`}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
