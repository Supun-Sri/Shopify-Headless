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
      <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 'var(--r-card)', boxShadow: 'var(--sh-soft)' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', color: 'var(--uae-green)' }}>✓</div>
        <h2 style={{ color: 'var(--navy)', marginBottom: '12px', fontSize: '22px' }}>Quote Request Received</h2>
        <p style={{ color: 'var(--muted)', fontSize: '13.5px', lineHeight: 1.7, maxWidth: '440px', margin: '0 auto' }}>
          Thank you! Our materials and quotation team in Dubai will review your specs and contact you within 24 business hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Request a quote form">
      <div className="formrow">
        <label htmlFor="rfq-company">Company / Contractor Name</label>
        <input id="rfq-company" type="text" placeholder="Your company or project name" required />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="formrow">
          <label htmlFor="rfq-email">Email Address</label>
          <input id="rfq-email" type="email" placeholder="you@company.ae" required />
        </div>
        <div className="formrow">
          <label htmlFor="rfq-phone">Phone / WhatsApp</label>
          <input id="rfq-phone" type="tel" placeholder="+971" required />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="formrow">
          <label htmlFor="rfq-product">Material / Product</label>
          <input id="rfq-product" type="text" placeholder="e.g. Sika Ceram-215 / Tile Adhesive" />
        </div>
        <div className="formrow">
          <label htmlFor="rfq-qty">Quantity Requested</label>
          <input id="rfq-qty" type="text" placeholder="e.g. 200 bags / 5 pallets" required />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="formrow">
          <label htmlFor="rfq-budget">Target Price / Budget (optional)</label>
          <input id="rfq-budget" type="text" placeholder="AED per unit" />
        </div>
        <div className="formrow">
          <label htmlFor="rfq-timeline">Delivery Timeline</label>
          <input id="rfq-timeline" type="text" placeholder="e.g. within 2 weeks" />
        </div>
      </div>

      <div className="formrow">
        <label htmlFor="rfq-location">Project Location / Emirate</label>
        <select id="rfq-location" className="softselect" style={{ width: '100%', height: '48px' }}>
          <option value="">Select Emirate</option>
          <option>Dubai</option>
          <option>Abu Dhabi</option>
          <option>Sharjah</option>
          <option>Ajman</option>
          <option>Ras Al Khaimah</option>
          <option>Fujairah</option>
          <option>Umm Al Quwain</option>
          <option>Other / GCC</option>
        </select>
      </div>

      <div className="formrow">
        <label htmlFor="rfq-notes">Additional Notes / Specifications</label>
        <textarea id="rfq-notes" rows={3} placeholder="Provide technical requirements, batch certifications, or project specifics..."></textarea>
      </div>

      <button type="submit" className="btn primary block" style={{ marginTop: '20px' }}>
        Submit Quote Request
        <svg className="ic sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
    </form>
  );
}
