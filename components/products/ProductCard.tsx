'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useCallback } from 'react';
import type { ShopifyProduct } from '@/lib/types';
import PriceDisplay from '@/components/products/PriceDisplay';
import { useCartStore } from '@/lib/cart-store';
import { addLineItemAction } from '@/app/actions/cart';

interface ProductCardProps {
  product: ShopifyProduct;
  priority?: boolean;
}

export default function ProductCard({ product, priority = false }: ProductCardProps) {
  const image = product.images[0];
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const cartId = useCartStore((s) => s.cartId);
  const syncFromApi = useCartStore((s) => s.syncFromApi);

  // Get the first available variant
  const defaultVariant = product.variants.find(v => v.availableForSale) || product.variants[0];

  const handleAddToCart = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isAdding || !defaultVariant?.availableForSale) return;

    setIsAdding(true);
    setAdded(false);

    try {
      // Optimistic UI update
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

      // Reset "Added" state after 2s
      setTimeout(() => setAdded(false), 2000);

      // Server Action to Shopify
      const updatedCart = await addLineItemAction(cartId, defaultVariant.id, 1);
      syncFromApi(updatedCart.lines, updatedCart.id, updatedCart.checkoutUrl);
    } catch {
      // Error handling
    } finally {
      setIsAdding(false);
    }
  }, [isAdding, defaultVariant, addItem, openCart, product, image, cartId, syncFromApi]);

  return (
    <div className="product-card-wrapper">
      <div className="product-card-image">
        <Link
          href={`/products/${product.handle}`}
          className="product-card-link"
          id={`product-${product.handle}`}
        >
          {image ? (
            <Image
              src={image.url}
              alt={image.altText || product.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="product-card-img"
              priority={priority}
            />
          ) : (
            <div className="product-card-placeholder">
              <span>No Image</span>
            </div>
          )}
        </Link>
        
        {/* Hover Overlay with Add to Cart */}
        <div className="product-card-overlay">
          <button
            onClick={handleAddToCart}
            disabled={!defaultVariant?.availableForSale || isAdding}
            className={`product-card-add-btn ${added ? 'product-card-add-btn-added' : ''}`}
            aria-label={`Add ${product.title} to cart`}
          >
            {isAdding ? (
              <>
                <span className="add-to-cart-spinner" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="40" strokeLinecap="round">
                      <animateTransform attributeName="transform" type="rotate" values="0 12 12;360 12 12" dur="0.8s" repeatCount="indefinite" />
                    </circle>
                  </svg>
                </span>
                Adding...
              </>
            ) : added ? (
              'Added to Bag'
            ) : !defaultVariant?.availableForSale ? (
              'Out of Stock'
            ) : (
              'Add to Bag'
            )}
          </button>
        </div>
      </div>
      <Link href={`/products/${product.handle}`} className="product-card-info-link">
        <div className="product-card-info">
          {product.productType && (
            <p className="product-card-type">{product.productType}</p>
          )}
          <h3 className="product-card-title">{product.title}</h3>
          <PriceDisplay money={product.priceRange.minVariantPrice} />
        </div>
      </Link>
    </div>
  );
}
