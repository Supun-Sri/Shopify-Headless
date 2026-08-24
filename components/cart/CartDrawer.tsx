'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/lib/cart-store';
import { formatPrice, isValidCheckoutUrl } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import { updateLineItemAction, removeLineItemAction } from '@/app/actions/cart';

export default function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen);
  const closeCart = useCartStore((s) => s.closeCart);
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const checkoutUrl = useCartStore((s) => s.checkoutUrl);
  const subtotal = useCartStore((s) => s.subtotal());
  const currency = useCartStore((s) => s.currency());
  const totalQuantity = useCartStore((s) => s.totalQuantity());
  const cartId = useCartStore((s) => s.cartId);
  const syncFromApi = useCartStore((s) => s.syncFromApi);
  const drawerRef = useRef<HTMLDivElement>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') closeCart(); };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, closeCart]);

  const handleCheckout = () => {
    if (checkoutUrl && isValidCheckoutUrl(checkoutUrl)) {
      window.location.href = checkoutUrl;
    }
  };

  // Increase quantity by 1
  const handleIncrement = async (merchandiseId: string, lineId: string, currentQty: number) => {
    if (isUpdating || !cartId || lineId.startsWith('temp-')) return;
    const newQty = currentQty + 1;
    setIsUpdating(true);
    updateQuantity(merchandiseId, newQty); // optimistic
    try {
      const updatedCart = await updateLineItemAction(cartId, lineId, newQty);
      if (updatedCart.lines.length > 0) {
        syncFromApi(updatedCart.lines, updatedCart.id, updatedCart.checkoutUrl);
      } else {
        useCartStore.setState({ cartId: updatedCart.id, checkoutUrl: updatedCart.checkoutUrl });
      }
    } catch {
      updateQuantity(merchandiseId, currentQty); // revert to previous qty on failure
    } finally {
      setIsUpdating(false);
    }
  };

  // Decrease quantity by 1 — if already at 1, remove the item instead
  const handleDecrement = async (merchandiseId: string, lineId: string, currentQty: number) => {
    if (isUpdating || !cartId || lineId.startsWith('temp-')) return;
    setIsUpdating(true);

    if (currentQty <= 1) {
      // Remove directly — skip the 0-flash
      removeItem(merchandiseId); // optimistic removal
      try {
        const updatedCart = await removeLineItemAction(cartId, lineId);
        syncFromApi(updatedCart.lines, updatedCart.id, updatedCart.checkoutUrl);
      } catch {
        // Revert on failure — put the item back
        useCartStore.setState((state) => ({
          items: [...state.items, { id: lineId, merchandiseId, quantity: 1, title: '', variantTitle: '', price: { amount: '0', currencyCode: 'AED' }, image: null, handle: '' }],
        }));
      } finally {
        setIsUpdating(false);
      }
      return;
    }

    const newQty = currentQty - 1;
    updateQuantity(merchandiseId, newQty); // optimistic
    try {
      const updatedCart = await updateLineItemAction(cartId, lineId, newQty);
      syncFromApi(updatedCart.lines, updatedCart.id, updatedCart.checkoutUrl);
    } catch {
      updateQuantity(merchandiseId, currentQty); // revert
    } finally {
      setIsUpdating(false);
    }
  };

  // Remove item entirely
  const handleRemoveItem = async (merchandiseId: string, lineId: string) => {
    if (isUpdating || !cartId || lineId.startsWith('temp-')) {
      // If still a temp ID, just remove from local state
      removeItem(merchandiseId);
      return;
    }
    setIsUpdating(true);
    removeItem(merchandiseId); // optimistic
    try {
      const updatedCart = await removeLineItemAction(cartId, lineId);
      syncFromApi(updatedCart.lines, updatedCart.id, updatedCart.checkoutUrl);
    } catch {
      // Server failed but we already removed locally — keep it removed
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div
        className={`cart-backdrop ${isOpen ? 'cart-backdrop-open' : ''}`}
        onClick={closeCart}
        aria-hidden="true"
      />
      <div
        ref={drawerRef}
        className={`cart-drawer ${isOpen ? 'cart-drawer-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        id="cart-drawer"
      >
        {/* Header */}
        <div className="cart-drawer-header">
          <h2 className="cart-drawer-title">
            Cart {mounted && totalQuantity > 0 ? `(${totalQuantity})` : ''}
          </h2>
          <button onClick={closeCart} className="cart-drawer-close" aria-label="Close cart">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="cart-drawer-items">
          {!mounted || items.length === 0 ? (
            <div className="cart-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--silver)" strokeWidth="1.2">
                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <p className="cart-empty-text">Your cart is empty</p>
              <Link href="/products" className="cart-empty-link" onClick={closeCart}>
                Browse Products
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.merchandiseId} className="cart-item">
                <div className="cart-item-image">
                  {item.image ? (
                    <Image
                      src={item.image.url}
                      alt={item.image.altText || item.title}
                      fill
                      sizes="76px"
                      className="cart-item-img"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="cart-item-placeholder" />
                  )}
                </div>
                <div className="cart-item-details">
                  <div className="cart-item-header">
                    <div>
                      <Link href={`/products/${item.handle}`} className="cart-item-title" onClick={closeCart}>
                        {item.title}
                      </Link>
                      {item.variantTitle !== 'Default Title' && (
                        <p className="cart-item-variant">{item.variantTitle}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.merchandiseId, item.id)}
                      className="cart-item-remove"
                      aria-label={`Remove ${item.title}`}
                      disabled={isUpdating}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                  <div className="cart-item-footer">
                    <div className="cart-quantity">
                      <button
                        onClick={() => handleDecrement(item.merchandiseId, item.id, item.quantity)}
                        className="cart-qty-btn"
                        aria-label="Decrease quantity"
                        disabled={isUpdating}
                      >−</button>
                      <span className="cart-qty-value">{item.quantity}</span>
                      <button
                        onClick={() => handleIncrement(item.merchandiseId, item.id, item.quantity)}
                        className="cart-qty-btn"
                        aria-label="Increase quantity"
                        disabled={isUpdating}
                      >+</button>
                    </div>
                    <p className="cart-item-price">
                      {formatPrice({
                        amount: (parseFloat(item.price.amount) * item.quantity).toString(),
                        currencyCode: item.price.currencyCode,
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {mounted && items.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="cart-subtotal">
              <span>Subtotal</span>
              <span>{formatPrice({ amount: subtotal, currencyCode: currency })}</span>
            </div>
            <p className="cart-tax-note">VAT (5%) and shipping calculated at checkout</p>
            <button onClick={handleCheckout} className="cart-checkout-btn" id="checkout-button">
              Proceed to Checkout
            </button>
            <button onClick={closeCart} className="cart-continue-btn">
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}
