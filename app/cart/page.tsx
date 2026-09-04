'use client';

import { useCartStore } from '@/lib/cart-store';
import { useVatStore } from '@/lib/vat-store';
import { isValidCheckoutUrl } from '@/lib/utils';
import { updateLineItemAction, removeLineItemAction } from '@/app/actions/cart';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  const items = useCartStore((s) => s.items);
  const cartId = useCartStore((s) => s.cartId);
  const checkoutUrl = useCartStore((s) => s.checkoutUrl);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const syncFromApi = useCartStore((s) => s.syncFromApi);
  const subtotalStr = useCartStore((s) => s.subtotal());
  const subtotalNum = parseFloat(subtotalStr) || 0;
  const currency = useCartStore((s) => s.currency());

  const { isVatInclusive, vatRate } = useVatStore();
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="cartwrap" style={{ minHeight: '50vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ color: 'var(--muted)' }}>Loading your cart...</div>
      </div>
    );
  }

  const handleIncrement = async (merchandiseId: string, lineId: string, currentQty: number) => {
    if (isUpdating || !cartId || lineId.startsWith('temp-')) return;
    const newQty = currentQty + 1;
    setIsUpdating(true);
    updateQuantity(merchandiseId, newQty);
    try {
      const updatedCart = await updateLineItemAction(cartId, lineId, newQty);
      if (updatedCart.lines.length > 0) {
        syncFromApi(updatedCart.lines, updatedCart.id, updatedCart.checkoutUrl);
      }
    } catch {
      updateQuantity(merchandiseId, currentQty);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDecrement = async (merchandiseId: string, lineId: string, currentQty: number) => {
    if (isUpdating || !cartId || lineId.startsWith('temp-')) return;
    const newQty = currentQty - 1;
    setIsUpdating(true);
    if (newQty <= 0) {
      removeItem(merchandiseId);
      try {
        const updatedCart = await removeLineItemAction(cartId, lineId);
        syncFromApi(updatedCart.lines, updatedCart.id, updatedCart.checkoutUrl);
      } catch {
        // Revert
      } finally {
        setIsUpdating(false);
      }
      return;
    }

    updateQuantity(merchandiseId, newQty);
    try {
      const updatedCart = await updateLineItemAction(cartId, lineId, newQty);
      syncFromApi(updatedCart.lines, updatedCart.id, updatedCart.checkoutUrl);
    } catch {
      updateQuantity(merchandiseId, currentQty);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async (merchandiseId: string, lineId: string) => {
    if (isUpdating || !cartId) return;
    setIsUpdating(true);
    removeItem(merchandiseId);
    try {
      const updatedCart = await removeLineItemAction(cartId, lineId);
      syncFromApi(updatedCart.lines, updatedCart.id, updatedCart.checkoutUrl);
    } catch {
      // Revert if error
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCheckout = () => {
    if (checkoutUrl && isValidCheckoutUrl(checkoutUrl)) {
      window.location.href = checkoutUrl;
    }
  };

  // Calculations
  const shippingCost = subtotalNum > 500 || subtotalNum === 0 ? 0 : 35;
  const vatAmount = subtotalNum * vatRate;
  const grandTotal = subtotalNum + shippingCost;

  return (
    <>
      <div className="breadcrumb">
        <Link href="/">Home</Link> / <span>Your Cart</span>
      </div>

      <div className="cartwrap">
        {/* Left Column: Cart Items */}
        <div className="cartitems">
          {items.length === 0 ? (
            <div style={{ background: '#fff', padding: '48px 24px', textAlign: 'center', borderRadius: 'var(--r-card)', boxShadow: 'var(--sh-soft)' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px', color: 'var(--silver)' }}>🛒</div>
              <h2 style={{ fontSize: '20px', color: 'var(--navy)', marginBottom: '8px' }}>Your cart is currently empty</h2>
              <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>Looks like you haven't added any construction products yet.</p>
              <Link href="/products" className="btn primary">
                Browse Products
              </Link>
            </div>
          ) : (
            items.map((item) => {
              const itemTotal = parseFloat(item.price.amount) * item.quantity;
              return (
                <div key={item.id} className="cartline">
                  <div className="ph cartline-img">
                    {item.image?.url ? (
                      <Image
                        src={item.image.url}
                        alt={item.image.altText || item.title}
                        fill
                        sizes="76px"
                        style={{ objectFit: 'contain', padding: '6px' }}
                      />
                    ) : (
                      <svg className="ic lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      </svg>
                    )}
                  </div>

                  <div className="info">
                    <Link href={`/products/${item.handle}`} className="n" style={{ color: 'var(--navy)', textDecoration: 'none' }}>
                      {item.title}
                    </Link>
                    <div className="m">
                      {item.variantTitle !== 'Default Title' ? item.variantTitle : 'Standard'} &middot; Qty {item.quantity}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
                      <div className="stepper" style={{ transform: 'scale(0.85)', transformOrigin: 'left' }}>
                        <button
                          type="button"
                          onClick={() => handleDecrement(item.merchandiseId, item.id, item.quantity)}
                          aria-label="Decrease quantity"
                        >
                          &minus;
                        </button>
                        <input value={item.quantity} readOnly aria-label="Quantity" />
                        <button
                          type="button"
                          onClick={() => handleIncrement(item.merchandiseId, item.id, item.quantity)}
                          aria-label="Increase quantity"
                        >
                          &#43;
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemove(item.merchandiseId, item.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--signal-red)', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="price">
                    {currency} {itemTotal.toFixed(2)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Order Summary */}
        {items.length > 0 && (
          <div className="summary">
            <h4>Order Summary</h4>
            <div className="sumrow">
              <span>Subtotal</span>
              <span>{currency} {subtotalNum.toFixed(2)}</span>
            </div>
            <div className="sumrow">
              <span>Shipping</span>
              <span>{shippingCost === 0 ? 'Free' : `${currency} ${shippingCost.toFixed(2)}`}</span>
            </div>
            <div className="sumrow">
              <span>VAT ({Math.round(vatRate * 100)}%)</span>
              <span>{currency} {vatAmount.toFixed(2)}</span>
            </div>
            <div className="sumrow total">
              <span>Total</span>
              <span>{currency} {grandTotal.toFixed(2)}</span>
            </div>

            <button
              type="button"
              className="btn primary block"
              style={{ marginTop: '18px' }}
              onClick={handleCheckout}
            >
              Proceed to Checkout
              <svg className="ic sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
