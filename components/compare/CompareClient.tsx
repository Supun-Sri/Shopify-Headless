'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { ShopifyProduct } from '@/lib/types';
import { useCartStore } from '@/lib/cart-store';
import { useCompareStore } from '@/lib/compare-store';
import { addLineItemAction } from '@/app/actions/cart';
import { usePrice } from '@/lib/use-price';

export default function CompareClient() {
  const { formatWithVat, isVatInclusive, vatRate } = usePrice();
  const [mounted, setMounted] = useState(false);
  const products = useCompareStore((s) => s.products);
  const removeProduct = useCompareStore((s) => s.removeProduct);
  
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const cartId = useCartStore((s) => s.cartId);
  const syncFromApi = useCartStore((s) => s.syncFromApi);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRemove = (id: string) => {
    removeProduct(id);
  };

  const handleAddToCart = async (product: ShopifyProduct) => {
    const variant = product.variants[0];
    if (!variant) return;

    addItem({
      merchandiseId: variant.id,
      quantity: 1,
      title: product.title,
      variantTitle: variant.title,
      price: variant.price,
      image: product.images[0] ? { url: product.images[0].url, altText: product.images[0].altText } : null,
      handle: product.handle,
    });
    openCart();

    try {
      const updatedCart = await addLineItemAction(cartId, variant.id, 1);
      if (updatedCart?.id) {
        const localCount = useCartStore.getState().items.length;
        if (updatedCart.lines.length >= localCount) {
          syncFromApi(updatedCart.lines, updatedCart.id, updatedCart.checkoutUrl);
        } else {
          useCartStore.setState({ cartId: updatedCart.id, checkoutUrl: updatedCart.checkoutUrl });
        }
      }
    } catch {
      useCartStore.getState().removeItem(variant.id);
    }
  };

  if (!mounted) {
    return <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>Loading...</div>;
  }

  if (products.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
        <p>No products to compare. Add some products from the store to compare them side-by-side.</p>
        <Link href="/products" className="btn block" style={{ maxWidth: '240px', margin: '20px auto' }}>
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="compare-table-wrapper" style={{ overflowX: 'auto', paddingBottom: '20px' }}>
      <table className="compare-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
        <tbody>
          {/* Header Row: Products */}
          <tr>
            <td style={{ width: '200px', border: '1px solid var(--line)', padding: '16px' }}></td>
            {products.map((p) => {
              const basePrice = p.priceRange.minVariantPrice;
              
              // If globally exclusive is toggled on, formatWithVat already outputs the ex-tax price. 
              // We'll show the other value in the subtitle.
              const priceNum = parseFloat(basePrice.amount);
              const exclTaxAmount = priceNum / (1 + vatRate);
              const exclTaxStr = new Intl.NumberFormat('en-US', { style: 'currency', currency: basePrice.currencyCode }).format(exclTaxAmount);

              return (
                <td key={p.id} style={{ border: '1px solid var(--line)', padding: '24px', verticalAlign: 'top', position: 'relative', width: '300px' }}>
                  <button 
                    onClick={() => handleRemove(p.id)}
                    style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '18px' }}
                    aria-label={`Remove ${p.title} from comparison`}
                  >
                    ×
                  </button>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto', background: '#fff', borderRadius: '4px', border: '1px solid var(--chrome)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {p.images[0] ? (
                        <Image src={p.images[0].url} alt={p.title} fill style={{ objectFit: 'contain', padding: '8px' }} />
                      ) : (
                        <div style={{ color: 'var(--chrome)', fontSize: '40px' }}>{/* Placeholder image */}□</div>
                      )}
                    </div>
                    <Link href={`/products/${p.handle}`} style={{ textDecoration: 'none', color: 'var(--text)', fontWeight: 600, fontSize: '14px', lineHeight: 1.4 }}>
                      {p.title}
                    </Link>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy)' }}>{formatWithVat(basePrice)}</div>
                      {isVatInclusive && <div style={{ fontSize: '10.5px', color: 'var(--muted)' }}>Excl. Tax: {exclTaxStr}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                      <button 
                        className="btn-primary" 
                        style={{ flex: 1, padding: '8px', fontSize: '11px', textTransform: 'uppercase', borderRadius: '4px', background: '#1c3664' }}
                        onClick={() => handleAddToCart(p)}
                      >
                        Add to Cart
                      </button>
                      <button 
                        style={{ background: '#1c3664', color: '#fff', border: 'none', width: '34px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        aria-label="Add to Wishlist"
                      >
                        ♡
                      </button>
                    </div>
                  </div>
                </td>
              );
            })}
          </tr>

          {/* SKU Row */}
          <tr>
            <td style={{ border: '1px solid var(--line)', padding: '16px', fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>SKU</td>
            {products.map((p) => (
              <td key={p.id} style={{ border: '1px solid var(--line)', padding: '16px', fontSize: '13px', color: 'var(--text)' }}>
                {/* Fallback to variant ID or a mock SKU if variants lack SKU */}
                {p.variants[0]?.id.split('/').pop()?.slice(0, 8) || 'N/A'}
              </td>
            ))}
          </tr>

          {/* Description Row (HTML) */}
          <tr>
            <td style={{ border: '1px solid var(--line)', padding: '16px', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', verticalAlign: 'top' }}>Description</td>
            {products.map((p) => (
              <td key={p.id} style={{ border: '1px solid var(--line)', padding: '16px', fontSize: '13px', color: 'var(--text)', verticalAlign: 'top', lineHeight: 1.6 }}>
                {p.descriptionHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: p.descriptionHtml }} style={{ maxHeight: '300px', overflowY: 'auto' }} />
                ) : (
                  <p>{p.description}</p>
                )}
              </td>
            ))}
          </tr>

          {/* Short Description */}
          <tr>
            <td style={{ border: '1px solid var(--line)', padding: '16px', fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>Short Description</td>
            {products.map((p) => (
              <td key={p.id} style={{ border: '1px solid var(--line)', padding: '16px', fontSize: '13px', color: 'var(--text)' }}>
                {p.description.length > 150 ? p.description.substring(0, 150) + '...' : p.description}
              </td>
            ))}
          </tr>

          {/* Brand Name */}
          <tr>
            <td style={{ border: '1px solid var(--line)', padding: '16px', fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>Brand Name</td>
            {products.map((p) => (
              <td key={p.id} style={{ border: '1px solid var(--line)', padding: '16px', fontSize: '13px', color: 'var(--text)' }}>
                {p.vendor || 'N/A'}
              </td>
            ))}
          </tr>

          {/* By Activity / Tags */}
          <tr>
            <td style={{ border: '1px solid var(--line)', padding: '16px', fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>By Activity</td>
            {products.map((p) => (
              <td key={p.id} style={{ border: '1px solid var(--line)', padding: '16px', fontSize: '13px', color: 'var(--text)' }}>
                {p.tags && p.tags.length > 0 ? p.tags.slice(0, 2).join(', ') : 'N/A'}
              </td>
            ))}
          </tr>

          {/* By Product Type */}
          <tr>
            <td style={{ border: '1px solid var(--line)', padding: '16px', fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>By Product Type</td>
            {products.map((p) => (
              <td key={p.id} style={{ border: '1px solid var(--line)', padding: '16px', fontSize: '13px', color: 'var(--text)' }}>
                {p.productType || 'N/A'}
              </td>
            ))}
          </tr>
          
          {/* Content Type */}
          <tr>
            <td style={{ border: '1px solid var(--line)', padding: '16px', fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>Content Type</td>
            {products.map((p) => (
              <td key={p.id} style={{ border: '1px solid var(--line)', padding: '16px', fontSize: '13px', color: 'var(--text)' }}>
                Products
              </td>
            ))}
          </tr>

        </tbody>
      </table>
    </div>
  );
}
