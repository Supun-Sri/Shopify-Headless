'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useCartStore } from '@/lib/cart-store';
import { useRouter } from 'next/navigation';
import type { ShopifyCollection } from '@/lib/types';

type MegaMenuKey = 'collections' | null;

interface Props {
  collections: ShopifyCollection[];
}

export default function HeaderClient({ collections }: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenu, setOpenMenu] = useState<MegaMenuKey>(null);
  const totalQuantity = useCartStore((s) => s.totalQuantity());
  const toggleCart = useCartStore((s) => s.toggleCart);
  const router = useRouter();
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => { setMounted(true); }, []);

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setOpenMenu(null);
    setMobileMenuOpen(false);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setOpenMenu(null);
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const displayQuantity = mounted ? totalQuantity : 0;

  // Split collections into two columns for the mega menu
  const half = Math.ceil(collections.length / 2);
  const col1 = collections.slice(0, half);
  const col2 = collections.slice(half);

  return (
    <header className="header" ref={headerRef}>
      {/* ── Topbar ── */}
      <div className="topbar">
        <div className="topbar-left">
          <span>Free delivery on orders over AED 500</span>
          <span className="topbar-email">info@imperial.ae</span>
        </div>
        <div className="topbar-right">
          <div className="vattoggle">
            <button className="active" type="button">Inc VAT</button>
            <button type="button">Ex VAT</button>
          </div>
          <div className="topbar-currency">
            <select aria-label="Currency">
              <option>AED</option>
              <option>USD</option>
              <option>EUR</option>
              <option>SAR</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Main header row ── */}
      <div className="header-row">
        <Link href="/" className="header-logo" aria-label="IMPERIAL Middle East Home">
          <Image
            src="/logo.png"
            alt="Imperial Middle East"
            width={140}
            height={48}
            priority
            style={{ objectFit: 'contain', height: '48px', width: 'auto' }}
          />
        </Link>

        <form className="header-search" onSubmit={handleSearch} role="search">
          <input
            type="search"
            placeholder="Search products, brands, categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search products"
          />
          <button type="submit" aria-label="Search">Search</button>
        </form>

        <div className="header-icons">
          <div className="header-icon" tabIndex={0} role="button" aria-label="Wishlist">
            <div className="header-icon-box">♡</div>
            <span>Wishlist</span>
          </div>
          <div className="header-icon" tabIndex={0} role="button" aria-label="Account">
            <div className="header-icon-box">☺</div>
            <span>Account</span>
          </div>
          <button
            className="header-icon cart-icon-btn"
            type="button"
            onClick={toggleCart}
            aria-label={`Shopping cart with ${displayQuantity} items`}
            id="cart-toggle"
          >
            <div className="header-icon-box cart-icon-box">
              🛒
              {mounted && totalQuantity > 0 && (
                <span className="cart-badge">{totalQuantity}</span>
              )}
            </div>
            <span>Cart</span>
          </button>

          <button
            className="header-mobile-toggle"
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileMenuOpen
                ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
                : <><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="17" x2="20" y2="17" /></>
              }
            </svg>
          </button>
        </div>
      </div>

      {/* ── Mega Menu Nav ── */}
      <nav className="megabar" aria-label="Main navigation">
        {/* All Products — simple link */}
        <Link href="/products" className="megaitem megaitem-link">All Products</Link>

        {/* Collections dropdown — real data */}
        {collections.length > 0 && (
          <div
            className="megaitem"
            onMouseEnter={() => setOpenMenu('collections')}
            onMouseLeave={() => setOpenMenu(null)}
          >
            <button
              type="button"
              className="megaitem-btn"
              aria-expanded={openMenu === 'collections'}
              aria-haspopup="true"
              onClick={() => setOpenMenu(openMenu === 'collections' ? null : 'collections')}
            >
              Collections
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" aria-hidden="true"
                style={{ marginLeft: '4px', transition: 'transform 0.2s', transform: openMenu === 'collections' ? 'rotate(180deg)' : 'none' }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {openMenu === 'collections' && (
              <div className="megapanel" role="menu">
                {col1.length > 0 && (
                  <div className="megacol">
                    {col1.map((col) => (
                      <Link
                        key={col.id}
                        href={`/products?collection=${col.handle}`}
                        role="menuitem"
                        onClick={() => setOpenMenu(null)}
                      >
                        {col.title}
                      </Link>
                    ))}
                  </div>
                )}
                {col2.length > 0 && (
                  <div className="megacol">
                    {col2.map((col) => (
                      <Link
                        key={col.id}
                        href={`/products?collection=${col.handle}`}
                        role="menuitem"
                        onClick={() => setOpenMenu(null)}
                      >
                        {col.title}
                      </Link>
                    ))}
                  </div>
                )}
                <div className="megacol megacol-cta">
                  <Link href="/collections" className="megacol-view-all" onClick={() => setOpenMenu(null)}>
                    View all collections →
                  </Link>
                  <Link href="/rfq" className="megacol-rfq" onClick={() => setOpenMenu(null)}>
                    Request a Quote
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        <Link href="/rfq" className="megaitem megaitem-link highlight">
          Request a Quote
        </Link>
      </nav>

      {/* ── Mobile Menu ── */}
      {mobileMenuOpen && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          <Link href="/products" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
            All Products
          </Link>
          {collections.slice(0, 8).map((col) => (
            <Link
              key={col.id}
              href={`/products?collection=${col.handle}`}
              className="mobile-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              {col.title}
            </Link>
          ))}
          {collections.length > 8 && (
            <Link href="/collections" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              All Collections →
            </Link>
          )}
          <Link href="/rfq" className="mobile-nav-link mobile-nav-link-cta" onClick={() => setMobileMenuOpen(false)}>
            Request a Quote
          </Link>
        </nav>
      )}
    </header>
  );
}
