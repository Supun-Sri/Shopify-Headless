'use client';

import { create } from 'zustand';
import { toggleWishlistItem as toggleServer } from '@/app/actions/wishlist';

interface WishlistState {
  items: string[];
  setItems: (items: string[]) => void;
  toggleItem: (productId: string) => Promise<void>;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  setItems: (items) => set({ items }),
  toggleItem: async (productId: string) => {
    const current = get().items;
    const isAdded = current.includes(productId);
    
    // Optimistic update
    set({
      items: isAdded
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    });

    try {
      // Sync with server
      const updated = await toggleServer(productId);
      set({ items: updated });
    } catch (err) {
      // Revert on failure, probably not logged in
      set({ items: current });
      // Redirect to login or show alert
      window.location.href = '/api/auth/login';
    }
  },
}));
