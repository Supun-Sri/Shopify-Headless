'use client';

import { useWishlistStore } from '@/lib/wishlist-store';
import ProductCard from '@/components/products/ProductCard';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import type { ShopifyProduct } from '@/lib/types';

interface WishlistGridProps {
  initialProducts: ShopifyProduct[];
  catalogProducts?: ShopifyProduct[];
  maxItems?: number;
  compact?: boolean;
}

export function WishlistCountBadge({
  initialCount = 0,
  style,
  className,
  showZero = false,
}: {
  initialCount?: number;
  style?: React.CSSProperties;
  className?: string;
  showZero?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const count = useWishlistStore((s) => s.items.length);

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayCount = mounted ? count : initialCount;
  if (!showZero && displayCount <= 0) return null;

  return (
    <span className={className} style={style}>
      {displayCount}
    </span>
  );
}

export default function WishlistGrid({
  initialProducts,
  catalogProducts = [],
  maxItems,
  compact = false,
}: WishlistGridProps) {
  const [mounted, setMounted] = useState(false);
  const wishlistIds = useWishlistStore((s) => s.items);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use catalogProducts pool if provided so any item in client state can be rendered immediately
  const productPool = catalogProducts.length > 0 ? catalogProducts : initialProducts;

  const activeProducts = productPool.filter((p) =>
    wishlistIds.includes(p.id) || wishlistIds.some((id) => p.id.endsWith('/' + id) || id.endsWith('/' + p.id))
  );

  const displayed = maxItems ? activeProducts.slice(0, maxItems) : activeProducts;
  const initialDisplayed = maxItems ? initialProducts.slice(0, maxItems) : initialProducts;

  if (!mounted) {
    if (initialDisplayed.length > 0) {
      return (
        <div className="prodgrid">
          {initialDisplayed.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      );
    }
  }

  if (activeProducts.length === 0) {
    if (compact) {
      return (
        <div style={{ padding: '20px 0', color: 'var(--muted)', fontSize: '13.5px' }}>
          <p style={{ margin: '0 0 14px' }}>Your wishlist is currently empty.</p>
          <Link href="/products" className="btn secondary" style={{ fontSize: '12px', padding: '9px 16px' }}>
            Explore Catalogue
          </Link>
        </div>
      );
    }
    return (
      <div style={{ background: '#fff', padding: '56px 24px', textAlign: 'center', borderRadius: 'var(--r-card)', boxShadow: 'var(--sh-soft)' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', color: 'var(--silver)' }}>♡</div>
        <h2 style={{ fontSize: '20px', color: 'var(--navy)', marginBottom: '8px' }}>Your wishlist is empty</h2>
        <p style={{ color: 'var(--muted)', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px', lineHeight: 1.6 }}>
          Save materials, equipment, and chemicals by clicking the heart icon on any product card.
        </p>
        <Link href="/products" className="btn primary">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div>
      {!compact && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <p style={{ fontSize: '13.5px', color: 'var(--muted)', margin: 0 }}>
            Showing <strong>{activeProducts.length}</strong> saved {activeProducts.length === 1 ? 'item' : 'items'}
          </p>
        </div>
      )}
      <div className="prodgrid">
        {displayed.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
