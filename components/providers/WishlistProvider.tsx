'use client';

import { useEffect, useRef } from 'react';
import { useWishlistStore } from '@/lib/wishlist-store';

export default function WishlistProvider({
  initialItems,
  isLoggedIn = false,
  children,
}: {
  initialItems: string[];
  isLoggedIn?: boolean;
  children: React.ReactNode;
}) {
  const setItems = useWishlistStore((s) => s.setItems);
  const setLoggedIn = useWishlistStore((s) => s.setLoggedIn);
  const initialized = useRef(false);

  useEffect(() => {
    setLoggedIn(isLoggedIn);
    if (isLoggedIn) {
      document.cookie = 'customer_logged_in=1; path=/; max-age=86400; SameSite=Lax';
      if (!initialized.current) {
        if (initialItems && initialItems.length > 0) {
          const localItems = useWishlistStore.getState().items;
          const merged = Array.from(new Set([...localItems, ...initialItems]));
          setItems(merged);
        }
        initialized.current = true;
      }
    } else {
      document.cookie = 'customer_logged_in=; path=/; max-age=0; SameSite=Lax';
      useWishlistStore.setState({ items: [] });
    }
  }, [initialItems, isLoggedIn, setItems, setLoggedIn]);

  return <>{children}</>;
}
