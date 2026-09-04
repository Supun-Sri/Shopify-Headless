'use client';

import { useEffect, useRef } from 'react';
import { useWishlistStore } from '@/lib/wishlist-store';

export default function WishlistProvider({ initialItems, children }: { initialItems: string[], children: React.ReactNode }) {
  const setItems = useWishlistStore((s) => s.setItems);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      if (initialItems && initialItems.length > 0) {
        const localItems = useWishlistStore.getState().items;
        const merged = Array.from(new Set([...localItems, ...initialItems]));
        setItems(merged);
      }
      initialized.current = true;
    }
  }, [initialItems, setItems]);

  return <>{children}</>;
}
