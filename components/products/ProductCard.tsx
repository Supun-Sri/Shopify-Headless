'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useCallback } from 'react';
import type { ShopifyProduct } from '@/lib/types';
import { useCartStore } from '@/lib/cart-store';
import { useWishlistStore } from '@/lib/wishlist-store';
import { addLineItemAction } from '@/app/actions/cart';
import { usePrice } from '@/lib/use-price';

interface ProductCardProps {
  product: ShopifyProduct;
  priority?: boolean;
}

export default function ProductCard({ product, priority = false }: ProductCardProps) {
  const { formatWithVat } = usePrice();
  const image = product.images[0];
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);
  
  const wishlistItems = useWishlistStore((s) => s.items);
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);
  const wishlisted = wishlistItems.includes(product.id) || wishlistItems.some((id) => product.id.endsWith('/' + id) || id.endsWith('/' + product.id));

  const addItem = useCartStore((s) => s.addItem);
  const cartId = useCartStore((s) => s.cartId);
  const syncFromApi = useCartStore((s) => s.syncFromApi);

  const defaultVariant = product.variants.find((v) => v.availableForSale) || product.variants[0];
  const isAvailable = defaultVariant?.availableForSale;

  const handleAddToCart = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAdding || !isAvailable) return;

    setIsAdding(true);
    addItem({
      merchandiseId: defaultVariant.id,
      quantity: 1,
      title: product.title,
      variantTitle: defaultVariant.title,
      price: defaultVariant.price,
      image: image ? { url: image.url, altText: image.altText } : null,
      handle: product.handle,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);

    try {
      const updatedCart = await addLineItemAction(cartId, defaultVariant.id, 1);
      const localCount = useCartStore.getState().items.length;
      if (updatedCart.lines.length >= localCount) {
        // Shopify confirmed the item — sync to get real IDs and prices
        syncFromApi(updatedCart.lines, updatedCart.id, updatedCart.checkoutUrl);
      } else {
        // Shopify dropped the item (e.g. 0-inventory) — keep optimistic, just save cartId
        useCartStore.setState({ cartId: updatedCart.id, checkoutUrl: updatedCart.checkoutUrl });
      }
    } catch {
      // Network/API failure — remove the optimistic item (don't wipe whole cart)
      useCartStore.getState().removeItem(defaultVariant.id);
    } finally {
      setIsAdding(false);
    }
  }, [isAdding, isAvailable, defaultVariant, addItem, product, image, cartId, syncFromApi]);

  // ── Real stock status from Shopify ──
  const totalQty = product.totalInventory;
  const variantQty = defaultVariant?.quantityAvailable;
  // Use variant quantity if available, otherwise fall back to product total
  const stockQty = variantQty ?? totalQty;

  const stockStatus: 'In Stock' | 'Low Stock' | 'Out of Stock' = !isAvailable
    ? 'Out of Stock'
    : stockQty !== null && stockQty <= 0
    ? 'Out of Stock'
    : stockQty !== null && stockQty <= 10
    ? 'Low Stock'
    : 'In Stock';
  const isLowStock = stockStatus === 'Low Stock';

  return (
    <div className="card prod-card">
      {/* Wishlist button */}
      <button
        className={`wish prod-card-wish ${wishlisted ? 'active' : ''}`}
        aria-label={wishlisted ? `Remove ${product.title} from wishlist` : `Add ${product.title} to wishlist`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleWishlist(product.id);
        }}
      >
        <svg className={`ic sm ${wishlisted ? 'fill' : ''}`} viewBox="0 0 24 24" fill={wishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <path d="M12 20.2C9.5 18 4.5 14.4 4.5 10.6A3.9 3.9 0 0 1 12 8.4a3.9 3.9 0 0 1 7.5 2.2c0 3.8-5 7.4-7.5 9.6Z" />
        </svg>
      </button>

      {/* Product image */}
      <div className="ph prod-card-image">
        <Link
          href={`/products/${product.handle}`}
          id={`product-${product.handle}`}
          style={{ display: 'block', position: 'absolute', inset: 0 }}
        >
          {image ? (
            <Image
              src={image.url}
              alt={image.altText || product.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              style={{ objectFit: 'contain', padding: '12px' }}
              priority={priority}
            />
          ) : (
            <svg className="ic xl" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          )}
        </Link>
      </div>

      {/* Card body */}
      <div className="body prod-card-body">
        {product.vendor && (
          <div className="brand prod-card-brand">{product.vendor}</div>
        )}
        <Link href={`/products/${product.handle}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="name prod-card-name">{product.title}</div>
        </Link>
        <div className={`stock prod-card-stock ${isLowStock ? 'low' : stockStatus === 'Out of Stock' ? 'out' : ''}`}>
          {isLowStock ? (
            <svg className="ic sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          ) : (
            <svg className="ic sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
          {stockStatus === 'Out of Stock'
            ? 'Out of Stock'
            : isLowStock
            ? `Low Stock${stockQty !== null ? ` — ${stockQty} left` : ''}`
            : `In Stock${stockQty !== null ? ` (${stockQty})` : ''}`}
        </div>
        <div className="price prod-card-price">
          <span className="card-price-value">
            {formatWithVat(defaultVariant?.price ?? product.priceRange.minVariantPrice)}
          </span>
          <small> / unit</small>
        </div>
        <button
          className={`qadd prod-card-add ${added ? 'added' : ''}`}
          onClick={handleAddToCart}
          disabled={!isAvailable || isAdding}
          aria-label={`Add ${product.title} to cart`}
        >
          <svg className="ic sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {isAdding ? 'Adding...' : added ? '✓ Added' : isAvailable ? 'Quick Add' : 'Out of Stock'}
        </button>
      </div>
    </div>
  );
}
