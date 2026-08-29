'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ShopifyProduct } from './types';

interface CompareState {
  products: ShopifyProduct[];
  addProduct: (product: ShopifyProduct) => void;
  removeProduct: (id: string) => void;
  clearCompare: () => void;
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set) => ({
      products: [],
      addProduct: (product) =>
        set((state) => {
          // Prevent duplicates
          if (state.products.find((p) => p.id === product.id)) {
            return state;
          }
          // Optional: limit to 4 products to avoid UI breaking on desktop
          return { products: [...state.products, product].slice(-4) };
        }),
      removeProduct: (id) =>
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        })),
      clearCompare: () => set({ products: [] }),
    }),
    {
      name: 'imperial-compare',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
