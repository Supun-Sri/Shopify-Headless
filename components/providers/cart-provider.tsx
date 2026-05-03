'use client';

import { useEffect, useState } from 'react';

/**
 * Provider that ensures Zustand hydration happens only on the client.
 * Prevents SSR mismatch by rendering children only after mount.
 */
export default function CartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR, render children but cart state will be default (empty).
  // After hydration, Zustand will restore from localStorage.
  if (!mounted) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
