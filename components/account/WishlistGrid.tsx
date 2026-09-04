'use client';

import { useWishlistStore } from '@/lib/wishlist-store';
import ProductCard from '@/components/products/ProductCard';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import type { ShopifyProduct } from '@/lib/types';

interface WishlistGridProps {
  initialProducts: ShopifyProduct[];
}

export default function WishlistGrid({ initialProducts }: WishlistGridProps) {
  const [mounted, setMounted] = useState(false);
  const wishlistIds = useWishlistStore((s) => s.items);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="prodgrid">
        {initialProducts.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    );
  }

  const activeProducts = initialProducts.filter((p) =>
    wishlistIds.includes(p.id) || wishlistIds.some((id) => p.id.endsWith('/' + id) || id.endsWith('/' + p.id))
  );

  if (activeProducts.length === 0) {
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <p style={{ fontSize: '13.5px', color: 'var(--muted)', margin: 0 }}>
          Showing <strong>{activeProducts.length}</strong> saved {activeProducts.length === 1 ? 'item' : 'items'}
        </p>
      </div>
      <div className="prodgrid">
        {activeProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
