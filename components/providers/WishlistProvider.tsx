'use client';

import { useEffect, useRef } from 'react';
import { useWishlistStore } from '@/lib/wishlist-store';

export default function WishlistProvider({
  initialItems = [],
  isLoggedIn = false,
  children,
}: {
  initialItems: string[];
  isLoggedIn?: boolean;
  children: React.ReactNode;
}) {
  const setItems = useWishlistStore((s) => s.setItems);
  const setLoggedIn = useWishlistStore((s) => s.setLoggedIn);
  const prevLoggedInRef = useRef<boolean | null>(null);

  useEffect(() => {
    setLoggedIn(isLoggedIn);
    if (isLoggedIn) {
      document.cookie = 'customer_logged_in=1; path=/; max-age=86400; SameSite=Lax';

      // Always fetch customer's persistent wishlist from server
      const fetchServerWishlist = async () => {
        try {
          const res = await fetch('/api/wishlist', { cache: 'no-store' });
          if (res.ok) {
            const data = await res.json();
            if (data.isLoggedIn && Array.isArray(data.items)) {
              const localItems = useWishlistStore.getState().items;
              const merged = Array.from(new Set([...localItems, ...data.items, ...(initialItems || [])]));
              setItems(merged);
              return;
            }
          }
        } catch (e) {
          console.warn('Failed to fetch server wishlist:', e);
        }

        // Fallback to initialItems if API fetch didn't return
        if (initialItems && initialItems.length > 0) {
          const localItems = useWishlistStore.getState().items;
          const merged = Array.from(new Set([...localItems, ...initialItems]));
          setItems(merged);
        }
      };

      fetchServerWishlist();
    } else {
      document.cookie = 'customer_logged_in=; path=/; max-age=0; SameSite=Lax';
      useWishlistStore.setState({ items: [], isLoggedIn: false });
    }
    prevLoggedInRef.current = isLoggedIn;
  }, [initialItems, isLoggedIn, setItems, setLoggedIn]);

  return <>{children}</>;
}
