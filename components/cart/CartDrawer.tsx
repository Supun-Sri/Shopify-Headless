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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart();
    };
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

  const handleUpdateQuantity = async (merchandiseId: string, lineId: string, newQuantity: number) => {
    if (isUpdating || !cartId || lineId.startsWith('temp-')) return;
    setIsUpdating(true);
    updateQuantity(merchandiseId, newQuantity);
    try {
      const updatedCart = await updateLineItemAction(cartId, lineId, newQuantity);
      syncFromApi(updatedCart.lines, updatedCart.id, updatedCart.checkoutUrl);
    } catch {
      // Revert optimism if needed or show error
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveItem = async (merchandiseId: string, lineId: string) => {
    if (isUpdating || !cartId || lineId.startsWith('temp-')) return;
    setIsUpdating(true);
    removeItem(merchandiseId);
    try {
      const updatedCart = await removeLineItemAction(cartId, lineId);
      syncFromApi(updatedCart.lines, updatedCart.id, updatedCart.checkoutUrl);
    } catch {
      // Revert optimism if needed or show error
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div className={`cart-backdrop ${isOpen ? 'cart-backdrop-open' : ''}`} onClick={closeCart} aria-hidden="true" />
      <div ref={drawerRef} className={`cart-drawer ${isOpen ? 'cart-drawer-open' : ''}`} role="dialog" aria-modal="true" aria-label="Shopping bag" id="cart-drawer">
        <div className="cart-drawer-header">
          <h2 className="cart-drawer-title">Your Bag ({mounted ? totalQuantity : 0})</h2>
          <button onClick={closeCart} className="cart-drawer-close" aria-label="Close shopping bag">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        <div className="cart-drawer-items">
          {!mounted || items.length === 0 ? (
            <div className="cart-empty">
              <p className="cart-empty-text">Your bag is empty</p>
              <Link href="/products" className="cart-empty-link" onClick={closeCart}>Continue Shopping</Link>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.merchandiseId} className="cart-item">
                <div className="cart-item-image">
                  {item.image ? (
                    <Image src={item.image.url} alt={item.image.altText || item.title} fill sizes="80px" className="cart-item-img" />
                  ) : (
                    <div className="cart-item-placeholder" />
                  )}
                </div>
                <div className="cart-item-details">
                  <div className="cart-item-header">
                    <div>
                      <Link href={`/products/${item.handle}`} className="cart-item-title" onClick={closeCart}>{item.title}</Link>
                      {item.variantTitle !== 'Default Title' && <p className="cart-item-variant">{item.variantTitle}</p>}
                    </div>
                    <button onClick={() => handleRemoveItem(item.merchandiseId, item.id)} className="cart-item-remove" aria-label={`Remove ${item.title}`} disabled={isUpdating}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  </div>
                  <div className="cart-item-footer">
                    <div className="cart-quantity">
                      <button onClick={() => handleUpdateQuantity(item.merchandiseId, item.id, item.quantity - 1)} className="cart-qty-btn" aria-label="Decrease quantity" disabled={isUpdating}>−</button>
                      <span className="cart-qty-value">{item.quantity}</span>
                      <button onClick={() => handleUpdateQuantity(item.merchandiseId, item.id, item.quantity + 1)} className="cart-qty-btn" aria-label="Increase quantity" disabled={isUpdating}>+</button>
                    </div>
                    <p className="cart-item-price">{formatPrice({ amount: (parseFloat(item.price.amount) * item.quantity).toString(), currencyCode: item.price.currencyCode })}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {mounted && items.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="cart-subtotal"><span>Subtotal</span><span>{formatPrice({ amount: subtotal, currencyCode: currency })}</span></div>
            <p className="cart-tax-note">Taxes and shipping calculated at checkout</p>
            <button onClick={handleCheckout} className="cart-checkout-btn" id="checkout-button">Proceed to Checkout</button>
            <button onClick={closeCart} className="cart-continue-btn">Continue Shopping</button>
          </div>
        )}
      </div>
    </>
  );
}
