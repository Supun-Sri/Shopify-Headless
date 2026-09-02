'use client';

import { useEffect, useRef } from 'react';
import { useWishlistStore } from '@/lib/wishlist-store';

export default function WishlistProvider({ initialItems, children }: { initialItems: string[], children: React.ReactNode }) {
  const setItems = useWishlistStore((s) => s.setItems);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      setItems(initialItems);
      initialized.current = true;
    }
  }, [initialItems, setItems]);

  return <>{children}</>;
}
