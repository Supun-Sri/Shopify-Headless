'use client';

import { useState } from 'react';
import type { ShopifyProduct } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import ImageGallery from '@/components/products/ImageGallery';
import VariantSelector from '@/components/products/VariantSelector';
import AddToCartButton from '@/components/products/AddToCartButton';

export default function ProductDetailClient({ product }: { product: ShopifyProduct }) {
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants[0]?.id || '');
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [shippingOpen, setShippingOpen] = useState(false);

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];

  return (
    <div className="pdp-layout">
      {/* Gallery */}
      <div className="pdp-gallery">
        <ImageGallery images={product.images} productTitle={product.title} />
      </div>

      {/* Info */}
      <div className="pdp-info">
        {product.productType && <p className="pdp-collection">{product.productType}</p>}
        <h1 className="pdp-title">{product.title}</h1>
        <p className="pdp-price">
          {selectedVariant ? formatPrice(selectedVariant.price) : formatPrice(product.priceRange.minVariantPrice)}
        </p>

        {/* Variants */}
        <VariantSelector
          variants={product.variants}
          selectedVariantId={selectedVariantId}
          onSelect={setSelectedVariantId}
        />

        {/* Actions */}
        <div className="pdp-actions">
          {selectedVariant && (
            <AddToCartButton product={product} selectedVariant={selectedVariant} />
          )}
          <button className="wishlist-btn">Wishlist</button>
        </div>

        {/* Details Accordion */}
        <div className="pdp-accordion">
          <button className="pdp-accordion-header" onClick={() => setDetailsOpen(!detailsOpen)}>
            <span>Details &amp; Care</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
              style={{ transform: detailsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {detailsOpen && (
            <div className="pdp-accordion-content">
              {product.descriptionHtml ? (
                <div dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
              ) : (
                <p>{product.description || 'No description available.'}</p>
              )}
            </div>
          )}
        </div>

        <div className="pdp-accordion">
          <button className="pdp-accordion-header" onClick={() => setShippingOpen(!shippingOpen)}>
            <span>Shipping &amp; Returns</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
              style={{ transform: shippingOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {shippingOpen && (
            <div className="pdp-accordion-content">
              <p>Complimentary shipping on all orders. Express delivery available at checkout.</p>
              <p style={{ marginTop: '8px' }}>Returns accepted within 30 days of purchase. Items must be unworn with original tags.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
