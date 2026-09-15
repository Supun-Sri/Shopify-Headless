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
  const setServerSynced = useWishlistStore((s) => s.setServerSynced);

  // Track whether we've done the initial mount sync to prevent re-firing
  const mountedRef = useRef(false);
  // Track previous login state to detect login/logout transitions
  const prevLoggedInRef = useRef<boolean | null>(null);

  // One-time mount sync: apply server-rendered initialItems without clobbering
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      setLoggedIn(isLoggedIn);

      if (isLoggedIn && initialItems.length > 0) {
        // Merge server items with any locally cached items (from localStorage)
        const localItems = useWishlistStore.getState().items;
        const merged = Array.from(new Set([...localItems, ...initialItems]));
        setItems(merged);
        setServerSynced(true);
      } else if (!isLoggedIn) {
        // Not logged in — clear wishlist state
        useWishlistStore.setState({ items: [], isLoggedIn: false });
        setServerSynced(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty — only runs on mount

  // Handle login state transitions (e.g. login redirect back, or logout)
  useEffect(() => {
    // Skip the very first render (handled by mount effect above)
    if (prevLoggedInRef.current === null) {
      prevLoggedInRef.current = isLoggedIn;
      return;
    }

    // Only act on actual transitions
    if (prevLoggedInRef.current === isLoggedIn) return;
    prevLoggedInRef.current = isLoggedIn;

    setLoggedIn(isLoggedIn);

    if (isLoggedIn) {
      // User just logged in — fetch persistent wishlist from server
      document.cookie = 'customer_logged_in=1; path=/; max-age=86400; SameSite=Lax';

      const fetchServerWishlist = async () => {
        try {
          const res = await fetch('/api/wishlist', { cache: 'no-store' });
          if (res.ok) {
            const data = await res.json();
            if (data.isLoggedIn && Array.isArray(data.items)) {
              const localItems = useWishlistStore.getState().items;
              const merged = Array.from(new Set([...localItems, ...data.items]));
              setItems(merged);
              setServerSynced(true);
              return;
            }
          }
        } catch (e) {
          console.warn('Failed to fetch server wishlist:', e);
        }
        setServerSynced(true);
      };

      fetchServerWishlist();
    } else {
      // User just logged out — clear state
      document.cookie = 'customer_logged_in=; path=/; max-age=0; SameSite=Lax';
      useWishlistStore.setState({ items: [], isLoggedIn: false, _serverSynced: false });
    }
  }, [isLoggedIn, setItems, setLoggedIn, setServerSynced]);

  return <>{children}</>;
}
