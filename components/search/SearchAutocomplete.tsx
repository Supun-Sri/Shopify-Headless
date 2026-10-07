'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/utils';
import type { Money } from '@/lib/types';

interface SuggestProduct {
  id: string;
  title: string;
  handle: string;
  vendor: string;
  productType: string;
  imageUrl: string | null;
  price: Money;
}

interface QuickLink {
  label: string;
  href: string;
}

interface SuggestResponse {
  query: string;
  corrected: string | null;
  didYouMean: boolean;
  products: SuggestProduct[];
  categories: QuickLink[];
  brands: QuickLink[];
}

interface Props {
  className?: string;
  mobileOpen?: boolean;
  onNavigate?: () => void;
}

const DEBOUNCE_MS = 280;
const MIN_CHARS = 2;

export default function SearchAutocomplete({ className = '', mobileOpen = false, onNavigate }: Props) {
  const router = useRouter();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [data, setData] = useState<SuggestResponse | null>(null);

  const hasSuggestions =
    !!data &&
    (data.products.length > 0 ||
      data.categories.length > 0 ||
      data.brands.length > 0 ||
      data.didYouMean);

  const close = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  const goToSearch = useCallback(
    (q: string) => {
      const term = q.trim();
      if (!term) return;
      close();
      onNavigate?.();
      router.push(`/products?q=${encodeURIComponent(term)}`);
    },
    [close, onNavigate, router]
  );

  // Debounced fetch
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_CHARS) {
      setData(null);
      setLoading(false);
      abortRef.current?.abort();
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('suggest failed');
        const json = (await res.json()) as SuggestResponse;
        setData(json);
        setOpen(true);
        setActiveIndex(-1);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setData(null);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [query]);

  // Outside click
  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [close]);

  // Flat list of navigable items for keyboard
  const navItems: { key: string; href?: string; action?: () => void; label: string }[] = [];
  if (data?.didYouMean && data.corrected) {
    navItems.push({
      key: `dym-${data.corrected}`,
      action: () => goToSearch(data.corrected!),
      label: `Search for ${data.corrected}`,
    });
  }
  for (const c of data?.categories ?? []) {
    navItems.push({ key: `cat-${c.href}`, href: c.href, label: c.label });
  }
  for (const b of data?.brands ?? []) {
    navItems.push({ key: `brand-${b.href}`, href: b.href, label: b.label });
  }
  for (const p of data?.products ?? []) {
    navItems.push({
      key: p.id,
      href: `/products/${p.handle}`,
      label: p.title,
    });
  }
  if (query.trim().length >= MIN_CHARS) {
    navItems.push({
      key: 'view-all',
      action: () => goToSearch(data?.didYouMean && data.corrected ? data.corrected : query),
      label: `View all results for “${query.trim()}”`,
    });
  }

  const activateItem = (index: number) => {
    const item = navItems[index];
    if (!item) return;
    close();
    onNavigate?.();
    if (item.action) {
      item.action();
      return;
    }
    if (item.href) router.push(item.href);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp') && hasSuggestions) {
      setOpen(true);
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!navItems.length) return;
      setOpen(true);
      setActiveIndex((i) => (i + 1) % navItems.length);
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!navItems.length) return;
      setOpen(true);
      setActiveIndex((i) => (i <= 0 ? navItems.length - 1 : i - 1));
      return;
    }

    if (e.key === 'Enter' && activeIndex >= 0 && navItems[activeIndex]) {
      e.preventDefault();
      activateItem(activeIndex);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const term =
      data?.didYouMean && data.corrected && data.products.length > 0
        ? data.corrected
        : query;
    goToSearch(term);
  };

  const showPanel = open && query.trim().length >= MIN_CHARS && (hasSuggestions || loading);

  return (
    <div
      ref={rootRef}
      className={`search-autocomplete ${className} ${mobileOpen ? 'mobile-open' : ''}`.trim()}
    >
      <form className="searchbar" onSubmit={handleSubmit} role="search" autoComplete="off">
        <input
          type="search"
          placeholder="Search products, brands, categories..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length >= MIN_CHARS) setOpen(true);
          }}
          onKeyDown={onKeyDown}
          aria-label="Search products"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={showPanel}
          aria-activedescendant={
            activeIndex >= 0 && navItems[activeIndex]
              ? `${listId}-${activeIndex}`
              : undefined
          }
        />
        <button type="submit" aria-label="Search">
          <svg className="ic sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m16.5 16.5 4.5 4.5" />
          </svg>
          Search
        </button>
      </form>

      {showPanel && (
        <div className="search-suggest" id={listId} role="listbox" aria-label="Search suggestions">
          {loading && !hasSuggestions && (
            <div className="search-suggest-status">Searching…</div>
          )}

          {data?.didYouMean && data.corrected && (
            <button
              type="button"
              id={`${listId}-0`}
              role="option"
              aria-selected={activeIndex === 0}
              className={`search-suggest-dym ${activeIndex === 0 ? 'is-active' : ''}`}
              onMouseEnter={() => setActiveIndex(0)}
              onClick={() => goToSearch(data.corrected!)}
            >
              Did you mean <strong>{data.corrected}</strong>?
            </button>
          )}

          {data && data.categories.length > 0 && (
            <div className="search-suggest-group">
              <div className="search-suggest-label">Categories</div>
              {data.categories.map((c) => {
                const idx = navItems.findIndex((n) => n.key === `cat-${c.href}`);
                return (
                  <Link
                    key={c.href}
                    id={idx >= 0 ? `${listId}-${idx}` : undefined}
                    href={c.href}
                    role="option"
                    aria-selected={activeIndex === idx}
                    className={`search-suggest-link ${activeIndex === idx ? 'is-active' : ''}`}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => {
                      close();
                      onNavigate?.();
                    }}
                  >
                    {c.label}
                  </Link>
                );
              })}
            </div>
          )}

          {data && data.brands.length > 0 && (
            <div className="search-suggest-group">
              <div className="search-suggest-label">Brands</div>
              {data.brands.map((b) => {
                const idx = navItems.findIndex((n) => n.key === `brand-${b.href}`);
                return (
                  <Link
                    key={b.href}
                    id={idx >= 0 ? `${listId}-${idx}` : undefined}
                    href={b.href}
                    role="option"
                    aria-selected={activeIndex === idx}
                    className={`search-suggest-link ${activeIndex === idx ? 'is-active' : ''}`}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => {
                      close();
                      onNavigate?.();
                    }}
                  >
                    {b.label}
                  </Link>
                );
              })}
            </div>
          )}

          {data && data.products.length > 0 && (
            <div className="search-suggest-group">
              <div className="search-suggest-label">Products</div>
              {data.products.map((p) => {
                const idx = navItems.findIndex((n) => n.key === p.id);
                return (
                  <Link
                    key={p.id}
                    id={idx >= 0 ? `${listId}-${idx}` : undefined}
                    href={`/products/${p.handle}`}
                    role="option"
                    aria-selected={activeIndex === idx}
                    className={`search-suggest-product ${activeIndex === idx ? 'is-active' : ''}`}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => {
                      close();
                      onNavigate?.();
                    }}
                  >
                    <span className="search-suggest-thumb">
                      {p.imageUrl ? (
                        <Image
                          src={p.imageUrl}
                          alt=""
                          width={44}
                          height={44}
                          unoptimized
                        />
                      ) : (
                        <span className="search-suggest-thumb-empty" />
                      )}
                    </span>
                    <span className="search-suggest-meta">
                      <span className="search-suggest-title">{p.title}</span>
                      <span className="search-suggest-sub">
                        {[p.vendor, p.productType].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                    <span className="search-suggest-price">{formatPrice(p.price)}</span>
                  </Link>
                );
              })}
            </div>
          )}

          {!loading && data && !hasSuggestions && (
            <div className="search-suggest-status">No matches — try another spelling</div>
          )}

          {query.trim().length >= MIN_CHARS && (
            <button
              type="button"
              id={`${listId}-${navItems.length - 1}`}
              role="option"
              aria-selected={activeIndex === navItems.length - 1}
              className={`search-suggest-all ${activeIndex === navItems.length - 1 ? 'is-active' : ''}`}
              onMouseEnter={() => setActiveIndex(navItems.length - 1)}
              onClick={() =>
                goToSearch(data?.didYouMean && data.corrected ? data.corrected : query)
              }
            >
              View all results for “{query.trim()}”
            </button>
          )}
        </div>
      )}
    </div>
  );
}
