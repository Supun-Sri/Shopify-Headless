'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useCallback, useTransition } from 'react';

export default function ProductFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSort = searchParams.get('sort') || 'featured';
  const currentMinPrice = searchParams.get('minPrice') || '';
  const currentMaxPrice = searchParams.get('maxPrice') || '';

  const [minPrice, setMinPrice] = useState(currentMinPrice);
  const [maxPrice, setMaxPrice] = useState(currentMaxPrice);

  const updateFilters = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }

      startTransition(() => {
        router.push(`/products?${params.toString()}`);
      });
    },
    [searchParams, router]
  );

  const handlePriceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (minPrice) params.set('minPrice', minPrice);
    else params.delete('minPrice');

    if (maxPrice) params.set('maxPrice', maxPrice);
    else params.delete('maxPrice');

    startTransition(() => {
      router.push(`/products?${params.toString()}`);
    });
  };

  const handleClearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    startTransition(() => {
      router.push('/products');
    });
  };

  return (
    <div className="product-filters" style={{ display: 'flex', gap: '32px', marginBottom: '32px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
      
      {/* Sort Dropdown */}
      <div className="filter-group">
        <label htmlFor="sort-select" style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', color: 'var(--color-grey)' }}>
          Sort By
        </label>
        <select
          id="sort-select"
          value={currentSort}
          onChange={(e) => updateFilters('sort', e.target.value)}
          disabled={isPending}
          style={{
            padding: '12px 16px',
            border: '1px solid #e5e5e5',
            backgroundColor: 'transparent',
            fontFamily: 'var(--font-sans)',
            fontSize: '14px',
            outline: 'none',
            cursor: 'pointer',
            minWidth: '200px'
          }}
        >
          <option value="featured">Featured</option>
          <option value="newest">Newest Arrivals</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="best-selling">Best Selling</option>
        </select>
      </div>

      {/* Price Range Filter */}
      <div className="filter-group">
        <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', color: 'var(--color-grey)' }}>
          Price Range
        </label>
        <form onSubmit={handlePriceSubmit} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            disabled={isPending}
            style={{
              padding: '12px',
              border: '1px solid #e5e5e5',
              width: '80px',
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <span style={{ color: 'var(--color-grey)' }}>-</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            disabled={isPending}
            style={{
              padding: '12px',
              border: '1px solid #e5e5e5',
              width: '80px',
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={isPending || (minPrice === currentMinPrice && maxPrice === currentMaxPrice)}
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--color-charcoal)',
              color: 'var(--color-ivory)',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            Apply
          </button>
        </form>
      </div>

      {/* Active Filters / Clear */}
      {(currentMinPrice || currentMaxPrice || currentSort !== 'featured') && (
        <button
          onClick={handleClearFilters}
          disabled={isPending}
          style={{
            background: 'none',
            border: 'none',
            textDecoration: 'underline',
            cursor: 'pointer',
            fontSize: '14px',
            color: 'var(--color-grey)',
            padding: '12px 0'
          }}
        >
          Clear Filters
        </button>
      )}

    </div>
  );
}
