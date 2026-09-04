'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { toggleWishlistItem as toggleServer } from '@/app/actions/wishlist';

interface WishlistState {
  items: string[];
  isLoggedIn: boolean;
  setLoggedIn: (loggedIn: boolean) => void;
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
      isLoggedIn: false,
      setLoggedIn: (isLoggedIn) => set({ isLoggedIn }),
      setItems: (items) => {
        set({ items });
        syncCookie(items);
      },
      hasItem: (productId: string) =>
        get().items.includes(productId) ||
        get().items.some((id) => productId.endsWith('/' + id) || id.endsWith('/' + productId)),
      toggleItem: async (productId: string) => {
        const loggedIn = get().isLoggedIn || isCustomerLoggedIn();
        // Strictly require login for wishlist
        if (!loggedIn) {
          window.location.href = '/api/auth/login';
          return false;
        }

        const current = get().items;
        const isCurrentlyAdded =
          current.includes(productId) ||
          current.some((id) => productId.endsWith('/' + id) || id.endsWith('/' + productId));
        const nextAction: 'add' | 'remove' = isCurrentlyAdded ? 'remove' : 'add';

        const updated =
          nextAction === 'add'
            ? Array.from(new Set([...current, productId]))
            : current.filter(
                (id) => id !== productId && !productId.endsWith('/' + id) && !id.endsWith('/' + productId)
              );

        // Immediate optimistic update
        set({ items: updated });
        syncCookie(updated);

        try {
          const res = await toggleServer(productId, nextAction);
          if (res && res.error === 'UNAUTHENTICATED') {
            set({ items: [], isLoggedIn: false });
            window.location.href = '/api/auth/login';
            return false;
          }
          if (res && res.success && Array.isArray(res.items)) {
            set({ items: res.items });
            syncCookie(res.items);
          }
          return true;
        } catch (err) {
          console.warn('Server wishlist sync error, keeping optimistic state:', err);
          return true;
        }
      },
      removeItem: async (productId: string) => {
        const loggedIn = get().isLoggedIn || isCustomerLoggedIn();
        if (!loggedIn) {
          window.location.href = '/api/auth/login';
          return;
        }
        const current = get().items;
        const updated = current.filter(
          (id) => id !== productId && !productId.endsWith('/' + id) && !id.endsWith('/' + productId)
        );
        set({ items: updated });
        syncCookie(updated);
        try {
          await toggleServer(productId, 'remove');
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

