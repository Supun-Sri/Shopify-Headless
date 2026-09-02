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
  const wishlisted = wishlistItems.includes(product.id);

  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
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
    openCart();
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
  }, [isAdding, isAvailable, defaultVariant, addItem, openCart, product, image, cartId, syncFromApi]);

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
    <div className="prod-card">
      {/* Wishlist button */}
      <button
        className={`prod-card-wish ${wishlisted ? 'active' : ''}`}
        aria-label={wishlisted ? `Remove ${product.title} from wishlist` : `Add ${product.title} to wishlist`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleWishlist(product.id);
        }}
      >
        {wishlisted ? '♥' : '♡'}
      </button>

      {/* Product image */}
      <div className="prod-card-image">
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
              style={{ objectFit: 'cover' }}
              priority={priority}
            />
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: '11px', color: 'var(--silver)' }}>product</span>
          )}
        </Link>
      </div>

      {/* Card body */}
      <div className="prod-card-body">
        {product.vendor && (
          <div className="prod-card-brand">{product.vendor}</div>
        )}
        <Link href={`/products/${product.handle}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="prod-card-name">{product.title}</div>
        </Link>
        <div className={`prod-card-stock ${isLowStock ? 'low' : stockStatus === 'Out of Stock' ? 'out' : ''}`}>
          {stockStatus === 'Out of Stock'
            ? '✗ Out of Stock'
            : isLowStock
            ? `⚠ Low Stock${stockQty !== null ? ` — ${stockQty} left` : ''}`
            : `✓ In Stock${stockQty !== null ? ` (${stockQty})` : ''}`}
        </div>
        <div className="prod-card-price">
            <span className="card-price-value">
              {formatWithVat(defaultVariant?.price ?? product.priceRange.minVariantPrice)}
            </span><small> / unit</small>
        </div>
        <button
          className={`prod-card-add ${added ? 'added' : ''}`}
          onClick={handleAddToCart}
          disabled={!isAvailable || isAdding}
          aria-label={`Add ${product.title} to cart`}
        >
          {isAdding ? 'Adding...' : added ? '✓ Added' : isAvailable ? '+ Quick Add' : 'Out of Stock'}
        </button>
      </div>
    </div>
  );
}
