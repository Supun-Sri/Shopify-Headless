'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { toggleWishlistItem as toggleServer } from '@/app/actions/wishlist';

interface WishlistState {
  items: string[];
  setItems: (items: string[]) => void;
  toggleItem: (productId: string) => Promise<boolean>;
  removeItem: (productId: string) => Promise<void>;
  hasItem: (productId: string) => boolean;
}

export function isCustomerLoggedIn(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some((c) => c.trim().startsWith('customer_logged_in=1'));
}

function syncCookie(items: string[]) {
  if (typeof document !== 'undefined') {
    document.cookie = `wishlist_items=${encodeURIComponent(JSON.stringify(items))}; path=/; max-age=31536000; SameSite=Lax`;
  }
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      setItems: (items) => {
        set({ items });
        syncCookie(items);
      },
      hasItem: (productId: string) => get().items.includes(productId),
      toggleItem: async (productId: string) => {
        // Strictly require login for wishlist
        if (!isCustomerLoggedIn()) {
          window.location.href = '/api/auth/login';
          return false;
        }

        const current = get().items;
        const isAdded = current.includes(productId);
        const updated = isAdded
          ? current.filter((id) => id !== productId)
          : [...current, productId];

        // Immediate optimistic update to state & cookie
        set({ items: updated });
        syncCookie(updated);

        try {
          const serverResult = await toggleServer(productId);
          if (Array.isArray(serverResult)) {
            set({ items: serverResult });
            syncCookie(serverResult);
          }
          return true;
        } catch (err: any) {
          if (err?.message === 'UNAUTHENTICATED') {
            set({ items: [] });
            window.location.href = '/api/auth/login';
            return false;
          }
          return true;
        }
      },
      removeItem: async (productId: string) => {
        if (!isCustomerLoggedIn()) {
          window.location.href = '/api/auth/login';
          return;
        }
        const current = get().items;
        const updated = current.filter((id) => id !== productId);
        set({ items: updated });
        syncCookie(updated);
        try {
          await toggleServer(productId);
        } catch {
          // Keep local state
        }
      },
    }),
    {
      name: 'imperial_customer_wishlist',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

