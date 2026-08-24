'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartLineItem, Money } from './types';

// ─── Cart Store Types ────────────────────────────────────────────────────────

interface CartItem {
  id: string;                   // cart line ID
  merchandiseId: string;        // variant ID
  quantity: number;
  title: string;                // product title
  variantTitle: string;         // variant title (e.g., "FR 36")
  price: Money;
  image: { url: string; altText: string | null } | null;
  handle: string;
}

interface CartState {
  // State
  cartId: string | null;
  checkoutUrl: string | null;
  items: CartItem[];
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;

  // Computed
  totalQuantity: () => number;
  subtotal: () => string;
  currency: () => string;

  // Actions
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  setCartId: (id: string) => void;
  setCheckoutUrl: (url: string) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;

  addItem: (item: Omit<CartItem, 'id'> & { id?: string }) => void;
  removeItem: (merchandiseId: string) => void;
  updateQuantity: (merchandiseId: string, quantity: number) => void;
  clearCart: () => void;
  syncFromApi: (lines: CartLineItem[], cartId: string, checkoutUrl: string) => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      // Initial state
      cartId: null,
      checkoutUrl: null,
      items: [],
      isOpen: false,
      isLoading: false,
      error: null,

      // Computed
      totalQuantity: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: () => {
        const total = get().items.reduce(
          (sum, item) => sum + parseFloat(item.price.amount) * item.quantity,
          0
        );
        return total.toFixed(2);
      },
      currency: () => get().items[0]?.price.currencyCode || 'USD',

      // UI Actions
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      // Cart identity
      setCartId: (id) => set({ cartId: id }),
      setCheckoutUrl: (url) => set({ checkoutUrl: url }),
      setError: (error) => set({ error }),
      setLoading: (loading) => set({ isLoading: loading }),

      // Item actions (optimistic)
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.merchandiseId === item.merchandiseId
          );

          if (existing) {
            return {
              items: state.items.map((i) =>
                i.merchandiseId === item.merchandiseId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
              error: null,
            };
          }

          return {
            items: [
              ...state.items,
              {
                ...item,
                id: item.id || `temp-${Date.now()}`,
              },
            ],
            error: null,
          };
        }),

      removeItem: (merchandiseId) =>
        set((state) => ({
          items: state.items.filter((i) => i.merchandiseId !== merchandiseId),
          error: null,
        })),

      updateQuantity: (merchandiseId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter((i) => i.merchandiseId !== merchandiseId),
              error: null,
            };
          }

          return {
            items: state.items.map((i) =>
              i.merchandiseId === merchandiseId ? { ...i, quantity } : i
            ),
            error: null,
          };
        }),

      clearCart: () =>
        set({
          items: [],
          cartId: null,
          checkoutUrl: null,
          error: null,
        }),

      // Sync with API response
      syncFromApi: (lines, cartId, checkoutUrl) =>
        set({
          cartId,
          checkoutUrl,
          items: lines.map((line) => ({
            id: line.id,
            merchandiseId: line.merchandise.id,
            quantity: line.quantity,
            title: line.merchandise.product.title,
            variantTitle: line.merchandise.title,
            price: line.merchandise.price,
            image: line.merchandise.product.featuredImage,
            handle: line.merchandise.product.handle,
          })),
          error: null,
        }),
    }),
    {
      name: 'imperial-cart',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') {
          return localStorage;
        }
        // SSR fallback: no-op storage
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      partialize: (state) => ({
        cartId: state.cartId,
        checkoutUrl: state.checkoutUrl,
        items: state.items,
      }),
    }
  )
);
