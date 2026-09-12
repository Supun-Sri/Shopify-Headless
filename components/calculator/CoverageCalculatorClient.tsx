'use client';

import { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { ShopifyProduct } from '@/lib/types';
import { useCartStore } from '@/lib/cart-store';
import { usePrice } from '@/lib/use-price';
import { addLineItemAction } from '@/app/actions/cart';
import {
  calculateGroutConsumption,
  calculateSealantConsumption,
  getSuggestedJointDepth,
  type GroutCalculationResult,
  type SealantCalculationResult,
} from '@/lib/calculator-engine';

interface CoverageCalculatorClientProps {
  products: ShopifyProduct[];
  isLoggedIn?: boolean;
}

export default function CoverageCalculatorClient({
  products,
  isLoggedIn = false,
}: CoverageCalculatorClientProps) {
  const { formatWithVat } = usePrice();
  const addItem = useCartStore((s) => s.addItem);
  const cartId = useCartStore((s) => s.cartId);
  const syncFromApi = useCartStore((s) => s.syncFromApi);

  const [activeTab, setActiveTab] = useState<'grout' | 'sealant'>('grout');

  // Filter Shopify products into grouts and sealants
  const groutProducts = useMemo(() => {
    return products.filter((p) => {
      const text = `${p.title} ${p.tags.join(' ')} ${p.productType}`.toLowerCase();
      return text.includes('grout') || text.includes('tile adhesive') || text.includes('mortar');
    });
  }, [products]);

  const sealantProducts = useMemo(() => {
    return products.filter((p) => {
      const text = `${p.title} ${p.tags.join(' ')} ${p.productType}`.toLowerCase();
      return text.includes('sealant') || text.includes('filler') || text.includes('silicone') || text.includes('joint');
    });
  }, [products]);

  // ─── Grout State ──────────────────────────────────────────────────────────
  const [selectedGroutProductId, setSelectedGroutProductId] = useState<string>(
    groutProducts[0]?.id || 'generic-grout'
  );
  const [tileLength, setTileLength] = useState<string>('600');
  const [tileWidth, setTileWidth] = useState<string>('600');
  const [tileThickness, setTileThickness] = useState<string>('10');
  const [groutJointWidth, setGroutJointWidth] = useState<string>('3');
  const [groutArea, setGroutArea] = useState<string>('50');
  const [groutWaste, setGroutWaste] = useState<string>('5');
  const [groutResult, setGroutResult] = useState<GroutCalculationResult | null>(null);

  // ─── Sealant State ────────────────────────────────────────────────────────
  const [selectedSealantProductId, setSelectedSealantProductId] = useState<string>(
    sealantProducts[0]?.id || 'generic-sealant'
  );
  const [linearMeters, setLinearMeters] = useState<string>('25');
  const [sealantJointWidth, setSealantJointWidth] = useState<string>('10');
  const [sealantJointDepth, setSealantJointDepth] = useState<string>('10');
  const [sealantWaste, setSealantWaste] = useState<string>('10');
  const [showJointGuide, setShowJointGuide] = useState<boolean>(false);
  const [sealantResult, setSealantResult] = useState<SealantCalculationResult | null>(null);

  // Cart adding state
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Dynamic suggested depth for sealants
  const suggestedDepth = useMemo(() => {
    const w = parseFloat(sealantJointWidth) || 0;
    return getSuggestedJointDepth(w);
  }, [sealantJointWidth]);

  // When joint width changes, auto-update depth if user hasn't explicitly set a custom one
  const handleSealantWidthChange = (val: string) => {
    setSealantJointWidth(val);
    const num = parseFloat(val) || 0;
    const sug = getSuggestedJointDepth(num);
    setSealantJointDepth(sug.toString());
  };

  // Selected product objects
  const currentGroutProduct = useMemo(() => {
    return products.find((p) => p.id === selectedGroutProductId);
  }, [products, selectedGroutProductId]);

  const currentSealantProduct = useMemo(() => {
    return products.find((p) => p.id === selectedSealantProductId);
  }, [products, selectedSealantProductId]);

  // ─── Submit Handlers ──────────────────────────────────────────────────────
  const handleGroutSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const l = parseFloat(tileLength) || 0;
    const w = parseFloat(tileWidth) || 0;
    const t = parseFloat(tileThickness) || 0;
    const j = parseFloat(groutJointWidth) || 0;
    const a = parseFloat(groutArea) || 0;
    const waste = parseFloat(groutWaste) || 5;

    const res = calculateGroutConsumption({
      tileLengthMm: l,
      tileWidthMm: w,
      tileThicknessMm: t,
      jointWidthMm: j,
      areaSqm: a,
      wastePercent: waste,
      packWeightKg: 20, // default standard 20kg bag or 5kg
    });
    setGroutResult(res);
  };

  const handleSealantSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const lm = parseFloat(linearMeters) || 0;
    const jw = parseFloat(sealantJointWidth) || 0;
    const jd = parseFloat(sealantJointDepth) || 0;
    const waste = parseFloat(sealantWaste) || 10;

    const res = calculateSealantConsumption({
      linearMeters: lm,
      jointWidthMm: jw,
      jointDepthMm: jd,
      wastePercent: waste,
      cartridgeVolumeMl: 310,
      sausageVolumeMl: 600,
    });
    setSealantResult(res);
  };

  const handleResetGrout = () => {
    setTileLength('600');
    setTileWidth('600');
    setTileThickness('10');
    setGroutJointWidth('3');
    setGroutArea('50');
    setGroutWaste('5');
    setGroutResult(null);
  };

  const handleResetSealant = () => {
    setLinearMeters('25');
    setSealantJointWidth('10');
    setSealantJointDepth('10');
    setSealantWaste('10');
    setSealantResult(null);
  };

  // Add calculated quantity to Shopify cart
  const handleAddToCart = useCallback(
    async (product: ShopifyProduct, quantity: number) => {
      if (isAddingToCart || !product || quantity <= 0) return;
      setIsAddingToCart(true);

      const variant = product.variants.find((v) => v.availableForSale) || product.variants[0];
      if (!variant) {
        setIsAddingToCart(false);
        return;
      }

      addItem({
        merchandiseId: variant.id,
        quantity,
        title: product.title,
        variantTitle: variant.title,
        price: variant.price,
        image: product.images[0] ? { url: product.images[0].url, altText: product.images[0].altText } : null,
        handle: product.handle,
      });

      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 3000);

      try {
        const updatedCart = await addLineItemAction(cartId, variant.id, quantity);
        const localCount = useCartStore.getState().items.length;
        if (updatedCart.lines.length >= localCount) {
          syncFromApi(updatedCart.lines, updatedCart.id, updatedCart.checkoutUrl);
        } else {
          useCartStore.setState({ cartId: updatedCart.id, checkoutUrl: updatedCart.checkoutUrl });
        }
      } catch {
        // network fallback
      } finally {
        setIsAddingToCart(false);
      }
    },
    [isAddingToCart, cartId, addItem, syncFromApi]
  );

  return (
    <div className="store-frame calc-page-wrapper" style={{ padding: '32px 28px 60px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '28px' }}>
        <div className="breadcrumb" style={{ padding: '0 0 14px' }}>
          <Link href="/">Home</Link> / <span>Coverage Calculator</span>
        </div>
        <div className="kicker">Technical Estimator</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 3.2vw, 36px)', color: 'var(--navy)', margin: '8px 0 10px', letterSpacing: '-0.02em' }}>
          Construction Material Calculator
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '13.5px', maxWidth: '680px', lineHeight: 1.6 }}>
          Calculate accurate consumption, material volume, and exact package counts for tile grouting and joint sealing according to international standards.
        </p>
      </div>

      {/* Top Segmented Mode Tabs (Matches Screenshot) */}
      <div
        style={{
          display: 'inline-flex',
          background: '#fff',
          borderRadius: 'var(--r-card)',
          padding: '6px',
          boxShadow: 'var(--sh-soft)',
          border: '1px solid var(--line)',
          marginBottom: '32px',
          width: '100%',
          maxWidth: '540px',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('grout')}
          className={`btn ${activeTab === 'grout' ? 'primary' : 'line'}`}
          style={{
            flex: 1,
            padding: '12px 18px',
            fontSize: '12.5px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            borderRadius: 'var(--r-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          {/* Tile Grout Grid SVG */}
          <svg className="ic sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          Grouts
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sealant')}
          className={`btn ${activeTab === 'sealant' ? 'primary' : 'line'}`}
          style={{
            flex: 1,
            padding: '12px 18px',
            fontSize: '12.5px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            borderRadius: 'var(--r-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          {/* Sealant Joint Width Arrow SVG */}
          <svg className="ic sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="3" x2="12" y2="21" />
            <polyline points="8 7 12 3 16 7" />
            <polyline points="8 17 12 21 16 17" />
            <line x1="4" y1="3" x2="4" y2="21" />
            <line x1="20" y1="3" x2="20" y2="21" />
          </svg>
          Sealants
        </button>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* GROUTS TAB                                                               */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'grout' && (
        <div style={{ background: '#fff', borderRadius: 'var(--r-card)', padding: '32px', boxShadow: 'var(--sh-soft)', border: '1px solid var(--line)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--navy)', marginBottom: '24px' }}>
            Calculation of joint consumption
          </h2>

          <form onSubmit={handleGroutSubmit}>
            {/* Product Selector */}
            <div className="formrow" style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--navy)', marginBottom: '8px', letterSpacing: '0.06em' }}>
                Product
              </label>
              <select
                value={selectedGroutProductId}
                onChange={(e) => setSelectedGroutProductId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--r-soft)',
                  border: '1px solid var(--line)',
                  background: 'var(--slot)',
                  fontSize: '13px',
                  color: 'var(--text)',
                  outline: 'none',
                }}
              >
                <option value="generic-grout">Standard Cementitious Tile Grout (20kg Bag - General)</option>
                {groutProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} — {formatWithVat(p.priceRange.minVariantPrice)}
                  </option>
                ))}
              </select>
            </div>

            {/* Tile Specifications Group */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Tile specifications
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>
                    Tile Length (mm)
                  </label>
                  <input
                    type="number"
                    value={tileLength}
                    onChange={(e) => setTileLength(e.target.value)}
                    placeholder="e.g. 600"
                    min="1"
                    style={{ width: '100%', padding: '12px', borderRadius: 'var(--r-soft)', border: '1px solid var(--line)', background: 'var(--slot)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>
                    Tile Width (mm)
                  </label>
                  <input
                    type="number"
                    value={tileWidth}
                    onChange={(e) => setTileWidth(e.target.value)}
                    placeholder="e.g. 600"
                    min="1"
                    style={{ width: '100%', padding: '12px', borderRadius: 'var(--r-soft)', border: '1px solid var(--line)', background: 'var(--slot)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>
                    Tile Thickness (mm)
                  </label>
                  <input
                    type="number"
                    value={tileThickness}
                    onChange={(e) => setTileThickness(e.target.value)}
                    placeholder="e.g. 10"
                    min="1"
                    style={{ width: '100%', padding: '12px', borderRadius: 'var(--r-soft)', border: '1px solid var(--line)', background: 'var(--slot)' }}
                  />
                </div>
              </div>
            </div>

            {/* Grout Specifications & Area Group */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginBottom: '28px' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Grout specifications
                </div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>
                  Grout Joint Width (mm) *
                </label>
                <input
                  type="number"
                  value={groutJointWidth}
                  onChange={(e) => setGroutJointWidth(e.target.value)}
                  placeholder="e.g. 3"
                  min="0.5"
                  step="0.5"
                  style={{ width: '100%', padding: '12px', borderRadius: 'var(--r-soft)', border: '1px solid var(--line)', background: 'var(--slot)' }}
                />
              </div>

              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Area to be covered
                </div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>
                  Area to be grouted (m²) *
                </label>
                <input
                  type="number"
                  value={groutArea}
                  onChange={(e) => setGroutArea(e.target.value)}
                  placeholder="e.g. 50"
                  min="0.1"
                  style={{ width: '100%', padding: '12px', borderRadius: 'var(--r-soft)', border: '1px solid var(--line)', background: 'var(--slot)' }}
                />
              </div>

              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Wastage Allowance
                </div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>
                  Recommended 5% - 10%
                </label>
                <select
                  value={groutWaste}
                  onChange={(e) => setGroutWaste(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: 'var(--r-soft)', border: '1px solid var(--line)', background: 'var(--slot)' }}
                >
                  <option value="0">0% (Exact Net Volume)</option>
                  <option value="5">5% (Standard Tile Layout)</option>
                  <option value="10">10% (Diagonal / High Waste)</option>
                  <option value="15">15% (Irregular / Mosaic)</option>
                </select>
              </div>
            </div>

            {/* Bottom Bar matching Screenshot: Log in prompt + RESET + SUBMIT */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--line)', paddingTop: '20px', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                {isLoggedIn ? (
                  <span style={{ color: 'var(--uae-green)', fontWeight: 600 }}>✓ Logged in as customer — Calculation will sync to your account</span>
                ) : (
                  <span>
                    If you wish to save the calculation result,{' '}
                    <Link href="/api/auth/login" style={{ color: 'var(--imperial-blue)', fontWeight: 600, textDecoration: 'underline' }}>
                      log in
                    </Link>{' '}
                    to the website.
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={handleResetGrout}
                  className="btn line"
                  style={{ padding: '10px 20px', fontSize: '12px', borderRadius: 'var(--r-soft)' }}
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="btn primary"
                  style={{ padding: '10px 24px', fontSize: '12px', borderRadius: 'var(--r-soft)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  {/* Calculator Icon */}
                  <svg className="ic sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="4" y="2" width="16" height="20" rx="2" />
                    <line x1="8" y1="6" x2="16" y2="6" />
                    <line x1="16" y1="14" x2="16" y2="18" />
                    <path d="M16 10h.01M12 10h.01M8 10h.01M12 14h.01M8 14h.01M12 18h.01M8 18h.01" />
                  </svg>
                  Calculate Grout
                </button>
              </div>
            </div>
          </form>

          {/* Grout Results Panel */}
          {groutResult && groutResult.grossMaterialKg > 0 && (
            <div
              style={{
                marginTop: '32px',
                background: 'linear-gradient(180deg, #f7faff 0%, #edf3fc 100%)',
                borderRadius: 'var(--r-card)',
                padding: '24px',
                border: '1px solid rgba(9, 79, 168, 0.2)',
                boxShadow: '0 8px 24px rgba(9, 79, 168, 0.08)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
                <div>
                  <div className="eyebrow" style={{ color: 'var(--imperial-blue)' }}>Estimated Consumption</div>
                  <h3 style={{ fontSize: '18px', color: 'var(--navy)', margin: '4px 0 0' }}>Grout Requirements Breakdown</h3>
                </div>
                <div style={{ background: '#fff', border: '1px solid var(--line)', padding: '6px 14px', borderRadius: 'var(--r-pill)', fontSize: '12px', fontWeight: 600, color: 'var(--navy)' }}>
                  Tile: {tileLength} × {tileWidth} × {tileThickness} mm | Joint: {groutJointWidth} mm
                </div>
              </div>

              {/* Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                <div style={{ background: '#fff', padding: '16px', borderRadius: 'var(--r-soft)', boxShadow: 'var(--sh-soft)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase' }}>Consumption Rate</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--navy)', margin: '4px 0' }}>
                    {groutResult.consumptionKgPerSqm} <span style={{ fontSize: '12px', fontWeight: 400 }}>kg/m²</span>
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--muted)' }}>Theoretical rate without waste</div>
                </div>

                <div style={{ background: '#fff', padding: '16px', borderRadius: 'var(--r-soft)', boxShadow: 'var(--sh-soft)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase' }}>Total Net Weight</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--navy)', margin: '4px 0' }}>
                    {groutResult.netMaterialKg} <span style={{ fontSize: '12px', fontWeight: 400 }}>kg</span>
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--muted)' }}>Net for {groutArea} m² area</div>
                </div>

                <div style={{ background: '#fff', padding: '16px', borderRadius: 'var(--r-soft)', boxShadow: 'var(--sh-soft)', border: '1px solid rgba(9, 79, 168, 0.3)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--imperial-blue)', fontWeight: 700, textTransform: 'uppercase' }}>Total Required (Gross)</div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--imperial-blue)', margin: '4px 0' }}>
                    {groutResult.grossMaterialKg} <span style={{ fontSize: '12px', fontWeight: 400 }}>kg</span>
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--muted)' }}>Includes {groutResult.wastePercent}% site wastage</div>
                </div>

                <div style={{ background: 'var(--navy)', padding: '16px', borderRadius: 'var(--r-soft)', color: '#fff', boxShadow: 'var(--sh-lift)' }}>
                  <div style={{ fontSize: '11px', color: '#b9cde8', textTransform: 'uppercase' }}>Bags Required</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#fff', margin: '4px 0' }}>
                    {groutResult.packsNeeded} <span style={{ fontSize: '13px', fontWeight: 400 }}>Bags (20kg)</span>
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#88a6d4' }}>Standard 20kg industrial packaging</div>
                </div>
              </div>

              {/* Action Buttons: Add to Cart / Request Quote */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '14px', flexWrap: 'wrap' }}>
                <Link
                  href={`/rfq?notes=${encodeURIComponent(`Grout calculation: Area: ${groutArea} m², Tile: ${tileLength}x${tileWidth}x${tileThickness}mm, Joint: ${groutJointWidth}mm, Total: ${groutResult.grossMaterialKg} kg (${groutResult.packsNeeded} bags)`)}`}
                  className="btn secondary"
                  style={{ borderRadius: 'var(--r-soft)', padding: '12px 20px', fontSize: '12.5px' }}
                >
                  Request a Quote
                </Link>

                {currentGroutProduct ? (
                  <button
                    type="button"
                    onClick={() => handleAddToCart(currentGroutProduct, groutResult.packsNeeded)}
                    disabled={isAddingToCart}
                    className="btn primary"
                    style={{ borderRadius: 'var(--r-soft)', padding: '12px 24px', fontSize: '12.5px' }}
                  >
                    {isAddingToCart ? 'Adding to Cart...' : addedSuccess ? '✓ Added to Cart!' : `Add ${groutResult.packsNeeded} Bags to Cart`}
                  </button>
                ) : (
                  <Link href="/products?collection=construction-chemicals" className="btn primary" style={{ borderRadius: 'var(--r-soft)', padding: '12px 24px', fontSize: '12.5px' }}>
                    Browse Available Grouts
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* SEALANTS TAB                                                             */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'sealant' && (
        <div style={{ background: '#fff', borderRadius: 'var(--r-card)', padding: '32px', boxShadow: 'var(--sh-soft)', border: '1px solid var(--line)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--navy)', marginBottom: '24px' }}>
            Calculation of sealant consumption
          </h2>

          <form onSubmit={handleSealantSubmit}>
            {/* Product Selector */}
            <div className="formrow" style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--navy)', marginBottom: '8px', letterSpacing: '0.06em' }}>
                Product
              </label>
              <select
                value={selectedSealantProductId}
                onChange={(e) => setSelectedSealantProductId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--r-soft)',
                  border: '1px solid var(--line)',
                  background: 'var(--slot)',
                  fontSize: '13px',
                  color: 'var(--text)',
                  outline: 'none',
                }}
              >
                <option value="generic-sealant">Standard Silicone / Polyurethane Sealant (310 mL Cartridge)</option>
                {sealantProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} — {formatWithVat(p.priceRange.minVariantPrice)}
                  </option>
                ))}
              </select>
            </div>

            {/* Perimeter to be sealed */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Perimeter to be sealed
              </div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>
                Linear meters to be sealed (m) *
              </label>
              <input
                type="number"
                value={linearMeters}
                onChange={(e) => setLinearMeters(e.target.value)}
                placeholder="e.g. 25"
                min="0.1"
                step="0.5"
                style={{ width: '100%', maxWidth: '360px', padding: '12px', borderRadius: 'var(--r-soft)', border: '1px solid var(--line)', background: 'var(--slot)' }}
              />
            </div>

            {/* Joint specifications */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Joint specifications
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>
                    Joint width (mm) *
                  </label>
                  <input
                    type="number"
                    value={sealantJointWidth}
                    onChange={(e) => handleSealantWidthChange(e.target.value)}
                    placeholder="e.g. 10"
                    min="2"
                    step="1"
                    style={{ width: '100%', padding: '12px', borderRadius: 'var(--r-soft)', border: '1px solid var(--line)', background: 'var(--slot)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>
                    Suggested joint depth (mm)
                  </label>
                  <div
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: 'var(--r-soft)',
                      border: '1px solid var(--line)',
                      background: 'rgba(9, 79, 168, 0.06)',
                      color: 'var(--imperial-blue)',
                      fontWeight: 600,
                      fontSize: '13px',
                    }}
                  >
                    ~{suggestedDepth} mm (Standard Rule)
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>
                    Joint depth (mm) *
                  </label>
                  <input
                    type="number"
                    value={sealantJointDepth}
                    onChange={(e) => setSealantJointDepth(e.target.value)}
                    placeholder="e.g. 10"
                    min="2"
                    step="1"
                    style={{ width: '100%', padding: '12px', borderRadius: 'var(--r-soft)', border: '1px solid var(--line)', background: 'var(--slot)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>
                    Wastage %
                  </label>
                  <select
                    value={sealantWaste}
                    onChange={(e) => setSealantWaste(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: 'var(--r-soft)', border: '1px solid var(--line)', background: 'var(--slot)' }}
                  >
                    <option value="5">5% (Clean joint)</option>
                    <option value="10">10% (Standard application)</option>
                    <option value="15">15% (Rough masonry/facade)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* "How to size the elastic joint?" helper link matching screenshot */}
            <div style={{ marginBottom: '24px' }}>
              <button
                type="button"
                onClick={() => setShowJointGuide(!showJointGuide)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--imperial-blue)',
                  fontWeight: 600,
                  fontSize: '12.5px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <svg className="ic sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                How to size the elastic joint? {showJointGuide ? '▲' : '▼'}
              </button>

              {showJointGuide && (
                <div
                  style={{
                    marginTop: '10px',
                    padding: '14px 18px',
                    background: 'var(--slot)',
                    borderRadius: 'var(--r-soft)',
                    fontSize: '12px',
                    lineHeight: 1.6,
                    color: 'var(--text)',
                    borderLeft: '3px solid var(--imperial-blue)',
                  }}
                >
                  <p style={{ margin: '0 0 6px', fontWeight: 600, color: 'var(--navy)' }}>
                    Standard Joint Sizing Engineering Rules:
                  </p>
                  <ul style={{ paddingLeft: '18px', margin: 0, color: 'var(--muted)' }}>
                    <li><strong>Width up to 10 mm:</strong> The joint depth should equal the joint width (minimum depth 6 mm). Aspect ratio 1:1.</li>
                    <li><strong>Width from 10 mm to 20 mm:</strong> The joint depth is typically kept at 10 mm to allow proper expansion.</li>
                    <li><strong>Width over 20 mm:</strong> The depth should be half of the joint width (aspect ratio 2:1, depth = width / 2).</li>
                    <li>Always use closed-cell backing rod (PE foam) to prevent three-sided adhesion and maintain correct joint depth.</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Bottom bar: Log in prompt + RESET + SUBMIT */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--line)', paddingTop: '20px', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                {isLoggedIn ? (
                  <span style={{ color: 'var(--uae-green)', fontWeight: 600 }}>✓ Logged in as customer — Calculation will sync to your account</span>
                ) : (
                  <span>
                    If you wish to save the calculation result,{' '}
                    <Link href="/api/auth/login" style={{ color: 'var(--imperial-blue)', fontWeight: 600, textDecoration: 'underline' }}>
                      log in
                    </Link>{' '}
                    to the website.
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={handleResetSealant}
                  className="btn line"
                  style={{ padding: '10px 20px', fontSize: '12px', borderRadius: 'var(--r-soft)' }}
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="btn primary"
                  style={{ padding: '10px 24px', fontSize: '12px', borderRadius: 'var(--r-soft)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <svg className="ic sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="4" y="2" width="16" height="20" rx="2" />
                    <line x1="8" y1="6" x2="16" y2="6" />
                    <line x1="16" y1="14" x2="16" y2="18" />
                    <path d="M16 10h.01M12 10h.01M8 10h.01M12 14h.01M8 14h.01M12 18h.01M8 18h.01" />
                  </svg>
                  Calculate Sealant
                </button>
              </div>
            </div>

            {/* Footer note matching screenshot */}
            <div style={{ marginTop: '14px', fontSize: '11px', color: 'var(--muted)' }}>
              The calculation is based on the actual volume to be filled and standard sealant density.
            </div>
          </form>

          {/* Sealant Results Panel */}
          {sealantResult && sealantResult.grossVolumeMl > 0 && (
            <div
              style={{
                marginTop: '32px',
                background: 'linear-gradient(180deg, #f7faff 0%, #edf3fc 100%)',
                borderRadius: 'var(--r-card)',
                padding: '24px',
                border: '1px solid rgba(9, 79, 168, 0.2)',
                boxShadow: '0 8px 24px rgba(9, 79, 168, 0.08)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
                <div>
                  <div className="eyebrow" style={{ color: 'var(--imperial-blue)' }}>Estimated Consumption</div>
                  <h3 style={{ fontSize: '18px', color: 'var(--navy)', margin: '4px 0 0' }}>Sealant Requirements Breakdown</h3>
                </div>
                <div style={{ background: '#fff', border: '1px solid var(--line)', padding: '6px 14px', borderRadius: 'var(--r-pill)', fontSize: '12px', fontWeight: 600, color: 'var(--navy)' }}>
                  Joint: {sealantJointWidth} × {sealantJointDepth} mm | Length: {linearMeters} m
                </div>
              </div>

              {/* Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                <div style={{ background: '#fff', padding: '16px', borderRadius: 'var(--r-soft)', boxShadow: 'var(--sh-soft)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase' }}>Volume per Meter</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--navy)', margin: '4px 0' }}>
                    {sealantResult.volumeMlPerMeter} <span style={{ fontSize: '12px', fontWeight: 400 }}>mL/m</span>
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--muted)' }}>Cross-sectional volume</div>
                </div>

                <div style={{ background: '#fff', padding: '16px', borderRadius: 'var(--r-soft)', boxShadow: 'var(--sh-soft)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase' }}>Total Required (Gross)</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--imperial-blue)', margin: '4px 0' }}>
                    {sealantResult.grossVolumeMl} <span style={{ fontSize: '12px', fontWeight: 400 }}>mL</span>
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--muted)' }}>Includes {sealantResult.wastePercent}% site wastage</div>
                </div>

                <div style={{ background: 'var(--navy)', padding: '16px', borderRadius: 'var(--r-soft)', color: '#fff', boxShadow: 'var(--sh-lift)' }}>
                  <div style={{ fontSize: '11px', color: '#b9cde8', textTransform: 'uppercase' }}>Cartridges (310 mL)</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#fff', margin: '4px 0' }}>
                    {sealantResult.cartridgesNeeded} <span style={{ fontSize: '13px', fontWeight: 400 }}>Cartridges</span>
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#88a6d4' }}>
                    Yield: ~{sealantResult.metersPerCartridge} m per 310mL cartridge
                  </div>
                </div>

                <div style={{ background: '#fff', padding: '16px', borderRadius: 'var(--r-soft)', boxShadow: 'var(--sh-soft)', border: '1px solid var(--line)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase' }}>Sausages (600 mL)</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--navy)', margin: '4px 0' }}>
                    {sealantResult.sausagesNeeded} <span style={{ fontSize: '12px', fontWeight: 400 }}>Sausage Foils</span>
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--muted)' }}>Industrial bulk packaging</div>
                </div>
              </div>

              {/* Action Buttons: Add to Cart / Request Quote */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '14px', flexWrap: 'wrap' }}>
                <Link
                  href={`/rfq?notes=${encodeURIComponent(`Sealant calculation: Joint: ${sealantJointWidth}x${sealantJointDepth}mm, Linear meters: ${linearMeters}m, Total volume: ${sealantResult.grossVolumeMl} mL (${sealantResult.cartridgesNeeded} cartridges of 310mL)`)}`}
                  className="btn secondary"
                  style={{ borderRadius: 'var(--r-soft)', padding: '12px 20px', fontSize: '12.5px' }}
                >
                  Request a Quote
                </Link>

                {currentSealantProduct ? (
                  <button
                    type="button"
                    onClick={() => handleAddToCart(currentSealantProduct, sealantResult.cartridgesNeeded)}
                    disabled={isAddingToCart}
                    className="btn primary"
                    style={{ borderRadius: 'var(--r-soft)', padding: '12px 24px', fontSize: '12.5px' }}
                  >
                    {isAddingToCart ? 'Adding to Cart...' : addedSuccess ? '✓ Added to Cart!' : `Add ${sealantResult.cartridgesNeeded} Cartridges to Cart`}
                  </button>
                ) : (
                  <Link href="/products?collection=construction-chemicals" className="btn primary" style={{ borderRadius: 'var(--r-soft)', padding: '12px 24px', fontSize: '12.5px' }}>
                    Browse Available Sealants
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
