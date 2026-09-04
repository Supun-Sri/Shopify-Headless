'use client';

import { useState } from 'react';
import type { ShopifyProduct } from '@/lib/types';

interface Props {
  products: Pick<ShopifyProduct, 'id' | 'title'>[];
}

export default function BulkInquiryForm({ products }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 'var(--r-card)', boxShadow: 'var(--sh-soft)' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', color: 'var(--uae-green)' }}>✓</div>
        <h2 style={{ color: 'var(--navy)', marginBottom: '12px', fontSize: '22px' }}>Bulk Inquiry Received</h2>
        <p style={{ color: 'var(--muted)', fontSize: '13.5px', lineHeight: 1.7, maxWidth: '440px', margin: '0 auto' }}>
          Thank you! Our wholesale and project supply team will review your quantities and contact you promptly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Bulk inquiry form">
      <div className="formrow">
        <label htmlFor="bulk-company">Company / Contracting Firm</label>
        <input id="bulk-company" type="text" placeholder="Your registered company name" required />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="formrow">
          <label htmlFor="bulk-email">Corporate Email</label>
          <input id="bulk-email" type="email" placeholder="you@company.ae" required />
        </div>
        <div className="formrow">
          <label htmlFor="bulk-phone">Phone / WhatsApp</label>
          <input id="bulk-phone" type="tel" placeholder="+971" required />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="formrow">
          <label htmlFor="bulk-product">Select Primary Product</label>
          <select id="bulk-product" className="softselect" style={{ width: '100%', height: '48px' }} required defaultValue="">
            <option value="" disabled>Select a product...</option>
            {products.map((p) => (
              <option key={p.id} value={p.title}>
                {p.title}
              </option>
            ))}
            <option value="other">Other / Multiple Products</option>
          </select>
        </div>
        <div className="formrow">
          <label htmlFor="bulk-qty">Required Quantity</label>
          <input id="bulk-qty" type="text" placeholder="e.g. 500 bags / 10 drums" required />
        </div>
      </div>

      <div className="formrow">
        <label htmlFor="bulk-docs">Upload Project BOQ / Material Schedule</label>
        <div style={{ background: '#fff', padding: '16px', borderRadius: 'var(--r-soft)', boxShadow: 'var(--sh-soft)' }}>
          <input
            id="bulk-docs"
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            style={{ width: '100%', cursor: 'pointer' }}
          />
          {file && (
            <small style={{ color: 'var(--imperial-blue)', marginTop: '6px', display: 'block', fontWeight: 600 }}>
              Attached: {file.name}
            </small>
          )}
        </div>
      </div>

      <div className="formrow">
        <label htmlFor="bulk-notes">Project Details / Target Price</label>
        <textarea id="bulk-notes" rows={4} placeholder="Delivery schedule, site location, target price in AED..." />
      </div>

      <button type="submit" className="btn primary block" style={{ marginTop: '20px' }}>
        Submit Bulk Inquiry
        <svg className="ic sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>

      <p style={{ marginTop: '16px', fontSize: '11px', color: 'var(--muted)', textAlign: 'center' }}>
        By submitting, our B2B procurement team will review your requirements and provide a tailored quotation.
      </p>
    </form>
  );
}
