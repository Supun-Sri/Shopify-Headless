'use client';

import { useState } from 'react';

export default function RFQForm() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
        <h2 style={{ color: 'var(--navy)', marginBottom: '12px', fontSize: '22px' }}>Quote Request Received</h2>
        <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.7, maxWidth: '400px', margin: '0 auto' }}>
          Thank you! Our team will review your request and respond within 24 business hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Request a quote form">
      <div className="form-row">
        <label htmlFor="rfq-company">Company Name</label>
        <input id="rfq-company" type="text" placeholder="Your company or project name" required />
      </div>

      <div className="form-row">
        <label htmlFor="rfq-email">Email Address</label>
        <input id="rfq-email" type="email" placeholder="you@company.ae" required />
      </div>

      <div className="form-row">
        <label htmlFor="rfq-phone">Phone / WhatsApp</label>
        <input id="rfq-phone" type="tel" placeholder="+971" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="form-row">
          <label htmlFor="rfq-product">Product / Material</label>
          <input id="rfq-product" type="text" placeholder="e.g. Sika Ceram-215" />
        </div>
        <div className="form-row">
          <label htmlFor="rfq-qty">Quantity Required</label>
          <input id="rfq-qty" type="text" placeholder="e.g. 200 bags" required />
        </div>
      </div>

      <div className="form-row">
        <label htmlFor="rfq-budget">Target Price / Budget (optional)</label>
        <input id="rfq-budget" type="text" placeholder="AED per unit or total budget" />
      </div>

      <div className="form-row">
        <label htmlFor="rfq-timeline">Delivery Timeline</label>
        <input id="rfq-timeline" type="text" placeholder="e.g. within 2 weeks" />
      </div>

      <div className="form-row">
        <label htmlFor="rfq-location">Delivery Location / Emirate</label>
        <select id="rfq-location">
          <option value="">Select Emirate</option>
          <option>Dubai</option>
          <option>Abu Dhabi</option>
          <option>Sharjah</option>
          <option>Ajman</option>
          <option>Ras Al Khaimah</option>
          <option>Fujairah</option>
          <option>Umm Al Quwain</option>
          <option>Other / Outside UAE</option>
        </select>
      </div>

      <div className="form-row">
        <label htmlFor="rfq-notes">Additional Notes</label>
        <textarea id="rfq-notes" rows={4} placeholder="Project details, special requirements, or other materials needed..." />
      </div>

      <button type="submit" className="btn block" style={{ marginTop: '18px' }}>
        Submit Quote Request
      </button>

      <p style={{ marginTop: '16px', fontSize: '11.5px', color: 'var(--muted)', textAlign: 'center' }}>
        By submitting, our team will review your request and respond within 24 business hours.
      </p>
    </form>
  );
}
