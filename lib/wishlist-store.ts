'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { toggleWishlistItem as toggleServer } from '@/app/actions/wishlist';

interface WishlistState {
  items: string[];
  isLoggedIn: boolean;
  _serverSynced: boolean;
  setLoggedIn: (loggedIn: boolean) => void;
  setItems: (items: string[]) => void;
  setServerSynced: (synced: boolean) => void;
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

function matchesId(a: string, b: string): boolean {
  return a === b || a.endsWith('/' + b) || b.endsWith('/' + a);
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoggedIn: false,
      _serverSynced: false,
      setLoggedIn: (isLoggedIn) => set({ isLoggedIn }),
      setServerSynced: (synced) => set({ _serverSynced: synced }),
      setItems: (items) => {
        set({ items });
        syncCookie(items);
      },
      hasItem: (productId: string) =>
        get().items.some((id) => matchesId(id, productId)),
      toggleItem: async (productId: string) => {
        const loggedIn = get().isLoggedIn || isCustomerLoggedIn();
        // Strictly require login for wishlist
        if (!loggedIn) {
          window.location.href = '/api/auth/login';
          return false;
        }

        const current = get().items;
        const isCurrentlyAdded = current.some((id) => matchesId(id, productId));
        const nextAction: 'add' | 'remove' = isCurrentlyAdded ? 'remove' : 'add';

        const updated =
          nextAction === 'add'
            ? Array.from(new Set([...current, productId]))
            : current.filter((id) => !matchesId(id, productId));

        // Immediate optimistic update
        set({ items: updated });
        syncCookie(updated);

        try {
          const res = await toggleServer(productId, nextAction, updated);
          if (res && res.error === 'UNAUTHENTICATED') {
            set({ items: [], isLoggedIn: false, _serverSynced: false });
            window.location.href = '/api/auth/login';
            return false;
          }
          if (res && res.success && Array.isArray(res.items)) {
            // Server confirmed — use server's authoritative list
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
        const updated = current.filter((id) => !matchesId(id, productId));
        set({ items: updated });
        syncCookie(updated);
        try {
          const res = await toggleServer(productId, 'remove', updated);
          if (res && res.success && Array.isArray(res.items)) {
            set({ items: res.items });
            syncCookie(res.items);
          }
        } catch {
          // Keep local state
        }
      },
    }),
    {
      name: 'imperial_customer_wishlist',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        // Don't persist isLoggedIn or _serverSynced — those are session-specific
      }),
    }
  )
);
