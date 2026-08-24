'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { ShopifyProduct } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/lib/cart-store';
import { addLineItemAction } from '@/app/actions/cart';

export default function ProductDetailClient({ product }: { product: ShopifyProduct }) {
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants[0]?.id || '');
  const [activeThumb, setActiveThumb] = useState(0);
  const [activeTab, setActiveTab] = useState<'desc' | 'docs' | 'reviews'>('desc');
  const [qty, setQty] = useState(1);
  const [calcArea, setCalcArea] = useState('');
  const [calcRate, setCalcRate] = useState('5');
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const cartId = useCartStore((s) => s.cartId);
  const syncFromApi = useCartStore((s) => s.syncFromApi);

  const selectedVariant =
    product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];
  const images = product.images;
  const activeImage = images[activeThumb];
  const isAvailable = selectedVariant?.availableForSale;

  // Coverage calc
  const calcResult = calcArea
    ? `${calcArea} sqm ÷ ${calcRate} sqm/bag → ${Math.ceil(parseFloat(calcArea) / parseFloat(calcRate))} bags needed.`
    : 'Enter area to calculate bags needed →';

  const handleAddToCart = useCallback(async () => {
    if (isAdding || !isAvailable) return;
    setIsAdding(true);
    addItem({
      merchandiseId: selectedVariant.id,
      quantity: qty,
      title: product.title,
      variantTitle: selectedVariant.title,
      price: selectedVariant.price,
      image: activeImage ? { url: activeImage.url, altText: activeImage.altText } : null,
      handle: product.handle,
    });
    setAdded(true);
    openCart();
    setTimeout(() => setAdded(false), 2500);
    try {
      const updatedCart = await addLineItemAction(cartId, selectedVariant.id, qty);
      const localCount = useCartStore.getState().items.length;
      if (updatedCart.lines.length >= localCount) {
        syncFromApi(updatedCart.lines, updatedCart.id, updatedCart.checkoutUrl);
      } else {
        useCartStore.setState({ cartId: updatedCart.id, checkoutUrl: updatedCart.checkoutUrl });
      }
    } catch {
      useCartStore.getState().removeItem(selectedVariant.id);
    } finally {
      setIsAdding(false);
    }
  }, [isAdding, isAvailable, selectedVariant, qty, addItem, openCart, product, activeImage, cartId, syncFromApi]);

  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <a href="/">Home</a> / <a href="/products">Products</a> / {product.title}
      </div>

      <div className="pdp-layout">
        {/* Gallery */}
        <div className="pdp-gallery">
          <div className="pdp-gallery-main">
            {activeImage ? (
              <Image
                src={activeImage.url}
                alt={activeImage.altText || product.title}
                fill
                sizes="420px"
                style={{ objectFit: 'cover' }}
                priority
              />
            ) : (
              <span style={{ color: 'var(--silver)', fontSize: '12px' }}>Main product image</span>
            )}
          </div>
          {images.length > 1 && (
            <div className="pdp-thumbrow">
              {images.slice(0, 5).map((img, i) => (
                <button
                  key={img.url}
                  className={`pdp-thumb ${i === activeThumb ? 'active' : ''}`}
                  onClick={() => setActiveThumb(i)}
                  aria-label={`View image ${i + 1}`}
                  style={{ border: 'none', cursor: 'pointer' }}
                >
                  <Image src={img.url} alt={img.altText || `${product.title} ${i + 1}`} fill sizes="68px" style={{ objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="pdp-info">
          {product.vendor && <div className="pdp-brand">{product.vendor}</div>}
          <h1 className="pdp-title">{product.title}</h1>
          <div className="pdp-sku">{selectedVariant?.title || 'Standard'}</div>

          {/* Price box */}
          <div className="pdp-pricebox">
            <div className="pdp-price">{formatPrice(selectedVariant?.price ?? product.priceRange.minVariantPrice)}</div>
            <div className="pdp-vatnote">Price includes 5% VAT</div>
          </div>

          {/* Stock */}
          {!isAvailable && (
            <div className="pdp-stock-msg low">✗ Out of Stock</div>
          )}

          {/* Variants */}
          {product.variants.length > 1 && (
            <div className="pdp-field">
              <label className="pdp-field-label">Pack Size</label>
              <div className="pdp-swatches">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    className={`pdp-swatch ${v.id === selectedVariantId ? 'active' : ''}`}
                    onClick={() => setSelectedVariantId(v.id)}
                    disabled={!v.availableForSale}
                    style={!v.availableForSale ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
                  >
                    {v.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Coverage Calculator */}
          <div className="pdp-field">
            <label className="pdp-field-label">Coverage Calculator</label>
            <div className="calc-box">
              <div className="calc-row">
                <div className="calc-cell">
                  <label htmlFor="calc-area">Area (sqm)</label>
                  <input
                    id="calc-area"
                    type="number"
                    placeholder="e.g. 45"
                    value={calcArea}
                    onChange={(e) => setCalcArea(e.target.value)}
                    min="0"
                  />
                </div>
                <div className="calc-cell">
                  <label htmlFor="calc-rate">Coverage rate</label>
                  <select id="calc-rate" value={calcRate} onChange={(e) => setCalcRate(e.target.value)}>
                    <option value="5">~5 sqm / 20kg bag</option>
                    <option value="4">~4 sqm / 20kg bag</option>
                    <option value="6">~6 sqm / 20kg bag</option>
                  </select>
                </div>
              </div>
              <div className="calc-result">{calcResult}</div>
            </div>
          </div>

          {/* Quantity */}
          <div className="pdp-field">
            <label className="pdp-field-label">Quantity</label>
            <div className="stepper">
              <button className="stepper-btn" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease quantity">−</button>
              <input className="stepper-input" value={qty} readOnly aria-label="Quantity" />
              <button className="stepper-btn" onClick={() => setQty(qty + 1)} aria-label="Increase quantity">+</button>
            </div>
          </div>

          {/* CTA Row */}
          <div className="pdp-cta-row">
            <button
              className={`btn block ${!isAvailable ? 'secondary' : ''}`}
              onClick={handleAddToCart}
              disabled={!isAvailable || isAdding}
              style={{ flex: 2 }}
            >
              {isAdding ? 'Adding...' : added ? '✓ Added to Cart' : isAvailable ? 'Add to Cart' : 'Out of Stock'}
            </button>
            <Link href="/rfq" className="btn secondary" style={{ flex: 1, textDecoration: 'none', textAlign: 'center' }}>
              Negotiate
            </Link>
          </div>

          {/* Action grid */}
          <div className="pdp-action-grid">
            <Link href="/rfq" className="pdp-action-btn" style={{ textDecoration: 'none' }}>
              <span className="lbl">💬 Send Inquiry</span>
              <span className="sub">Response within 24 hours</span>
            </Link>
            <button className="pdp-action-btn" onClick={() => alert('Chat widget')}>
              <span className="lbl">💭 Chat Now</span>
              <span className="sub">Talk to a product specialist</span>
            </button>
            <Link href="/rfq" className="pdp-action-btn" style={{ textDecoration: 'none' }}>
              <span className="lbl">🤝 Negotiate</span>
              <span className="sub">Request a custom quote</span>
            </Link>
            <button className="pdp-action-btn" onClick={() => setActiveTab('docs')}>
              <span className="lbl">📄 Technical Data</span>
              <span className="sub">Data sheets &amp; certifications</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="pdp-tabs" role="tablist">
            {(['desc', 'docs', 'reviews'] as const).map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                className={`pdp-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'desc' ? 'Description' : tab === 'docs' ? 'Documents' : 'Reviews'}
              </button>
            ))}
          </div>

          <div className="pdp-tabpanel" role="tabpanel">
            {activeTab === 'desc' && (
              product.descriptionHtml
                ? <div dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
                : <p>{product.description || 'High-performance construction chemical product. Please contact us for full technical specifications.'}</p>
            )}
            {activeTab === 'docs' && (
              <p>Technical Data Sheet (PDF) · Safety Data Sheet (PDF) · Application Guide (PDF)</p>
            )}
            {activeTab === 'reviews' && (
              <p>★★★★★ &quot;Used on a 400sqm villa floor — zero lippage issues.&quot; — Verified Buyer</p>
            )}
          </div>
        </div>
      </div>

      {/* Upsell */}
      <div className="section">
        <h2>You May Also Need</h2>
        <div style={{ fontSize: '13px', color: 'var(--muted)' }}>Related products will appear here.</div>
      </div>
    </>
  );
}
