'use client';

import { useEffect, useState, useRef } from 'react';
import { useCartStore } from '@/lib/cart-store';

/**
 * Cart provider that ensures Zustand hydration happens only on the client
 * and validates the persisted cart with Shopify on mount.
 */
export default function CartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const validatedRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // After mount, validate the persisted cart against Shopify
  useEffect(() => {
    if (!mounted || validatedRef.current) return;
    validatedRef.current = true;

    const validateCart = async () => {
      const { cartId, items } = useCartStore.getState();
      
      // No cart to validate
      if (!cartId || items.length === 0) return;

      try {
        // Dynamically import to avoid bundling server code
        const res = await fetch(`/api/cart/validate?cartId=${encodeURIComponent(cartId)}`);
        if (!res.ok) {
          // Cart is invalid or expired — clear local state
          console.warn('Persisted cart is invalid, clearing...');
          useCartStore.getState().clearCart();
          return;
        }

        const data = await res.json();
        if (data.cart && data.cart.lines) {
          // Sync from Shopify's latest state
          useCartStore.getState().syncFromApi(data.cart.lines, data.cart.id, data.cart.checkoutUrl);
        }
      } catch {
        // Network error — keep the local cart (optimistic)
        console.warn('Could not validate cart with Shopify, keeping local state');
      }
    };

    validateCart();
  }, [mounted]);

  // During SSR, render children but cart state will be default (empty).
  // After hydration, Zustand will restore from localStorage.
  if (!mounted) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
