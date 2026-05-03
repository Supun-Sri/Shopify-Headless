'use client';

import { useState, useCallback } from 'react';
import { useCartStore } from '@/lib/cart-store';
import type { ShopifyProduct, ShopifyVariant } from '@/lib/types';
import { addLineItemAction } from '@/app/actions/cart';

interface AddToCartButtonProps {
  product: ShopifyProduct;
  selectedVariant: ShopifyVariant;
  quantity?: number;
}

export default function AddToCartButton({
  product,
  selectedVariant,
  quantity = 1,
}: AddToCartButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const cartId = useCartStore((s) => s.cartId);
  const syncFromApi = useCartStore((s) => s.syncFromApi);

  const handleAddToCart = useCallback(async () => {
    // Double-submit prevention
    if (isAdding || !selectedVariant.availableForSale) return;

    setIsAdding(true);
    setAdded(false);

    try {
      // Optimistic UI update
      addItem({
        merchandiseId: selectedVariant.id,
        quantity,
        title: product.title,
        variantTitle: selectedVariant.title,
        price: selectedVariant.price,
        image: product.images[0]
          ? { url: product.images[0].url, altText: product.images[0].altText }
          : null,
        handle: product.handle,
      });

      setAdded(true);
      openCart();

      // Reset "Added" state after 2s
      setTimeout(() => setAdded(false), 2000);
      // Server Action to Shopify
      const updatedCart = await addLineItemAction(cartId, selectedVariant.id, quantity);
      syncFromApi(updatedCart.lines, updatedCart.id, updatedCart.checkoutUrl);
    } catch {
      // Error handling — could show toast
    } finally {
      setIsAdding(false);
    }
  }, [isAdding, selectedVariant, quantity, addItem, openCart, product, cartId, syncFromApi]);

  const isDisabled = !selectedVariant.availableForSale || isAdding;
  const buttonText = !selectedVariant.availableForSale
    ? 'Out of Stock'
    : added
      ? 'Added to Bag'
      : isAdding
        ? 'Adding...'
        : 'Add to Bag';

  return (
    <button
      onClick={handleAddToCart}
      disabled={isDisabled}
      className={`add-to-cart-btn ${isDisabled ? 'add-to-cart-btn-disabled' : ''} ${added ? 'add-to-cart-btn-added' : ''}`}
      id="add-to-cart"
      aria-busy={isAdding}
    >
      {isAdding && (
        <span className="add-to-cart-spinner" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="40" strokeLinecap="round">
              <animateTransform attributeName="transform" type="rotate" values="0 12 12;360 12 12" dur="0.8s" repeatCount="indefinite" />
            </circle>
          </svg>
        </span>
      )}
      {buttonText}
    </button>
  );
}
