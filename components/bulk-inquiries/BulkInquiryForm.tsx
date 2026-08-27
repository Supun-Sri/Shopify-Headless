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
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
        <h2 style={{ color: 'var(--navy)', marginBottom: '12px', fontSize: '22px' }}>Bulk Inquiry Received</h2>
        <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.7, maxWidth: '400px', margin: '0 auto' }}>
          Thank you! Our wholesale team will review your bulk request and documents, and get back to you shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Bulk inquiry form">
      <div className="form-row">
        <label htmlFor="bulk-company">Company Name</label>
        <input id="bulk-company" type="text" placeholder="Your company name" required />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="form-row">
          <label htmlFor="bulk-email">Email Address</label>
          <input id="bulk-email" type="email" placeholder="you@company.com" required />
        </div>
        <div className="form-row">
          <label htmlFor="bulk-phone">Phone / WhatsApp</label>
          <input id="bulk-phone" type="tel" placeholder="+971" required />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
        <div className="form-row">
          <label htmlFor="bulk-product">Select Product</label>
          <select id="bulk-product" required defaultValue="">
            <option value="" disabled>Select a product...</option>
            {products.map((p) => (
              <option key={p.id} value={p.title}>
                {p.title}
              </option>
            ))}
            <option value="other">Other / Multiple Products</option>
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="bulk-qty">Quantity</label>
          <input id="bulk-qty" type="text" placeholder="e.g. 500 units" required />
        </div>
      </div>

      <div className="form-row">
        <label htmlFor="bulk-docs">Upload Documents (Specs, BOQ, etc.)</label>
        <input
          id="bulk-docs"
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          style={{
            padding: '10px',
            border: '1px dashed var(--silver)',
            background: 'var(--pearl)',
            cursor: 'pointer',
          }}
        />
        {file && <small style={{ color: 'var(--imperial-blue)', marginTop: '4px', display: 'block' }}>Selected: {file.name}</small>}
      </div>

      <div className="form-row">
        <label htmlFor="bulk-notes">Additional Information</label>
        <textarea id="bulk-notes" rows={5} placeholder="Tell us more about your project requirements, target price, or delivery schedule..." />
      </div>

      <button type="submit" className="btn block" style={{ marginTop: '24px' }}>
        Submit Bulk Inquiry
      </button>

      <p style={{ marginTop: '16px', fontSize: '11.5px', color: 'var(--muted)', textAlign: 'center' }}>
        By submitting, our B2B team will review your requirements and provide a custom quotation.
      </p>
    </form>
  );
}
