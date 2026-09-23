'use client';

import React, { useState } from 'react';

const FAQS = [
  {
    question: 'How do I earn Imperial Rewards points?',
    answer: 'You earn points on every purchase made through our website. Once you accumulate enough points, you can redeem them for discounts on future orders or unlock professional tiers for exclusive pricing.'
  },
  {
    question: 'Can I restrict purchasing to approved business accounts only?',
    answer: 'Yes. Our B2B platform allows you to set up company profiles where guest access can be restricted, and authorized buyers can place orders using predefined credit limits.'
  },
  {
    question: 'How do I calculate the coverage for a product?',
    answer: 'Product coverage varies by substrate and application method. Please check the Technical Data Sheet (TDS) linked on each product page for precise calculation formulas, or contact our technical team for assistance.'
  },
  {
    question: 'Do you offer same-day delivery in the UAE?',
    answer: 'For items stocked in our Al Quoz warehouse, we offer same-day or next-day delivery within Dubai, and 24-48 hours for other emirates depending on the order volume.'
  }
];

export default function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <div className="section" style={{ background: '#fff', margin: '0 28px 64px', borderRadius: 'var(--r-card)', padding: '48px 40px', boxShadow: 'var(--sh-soft)' }}>
      <div className="sectionhead" style={{ marginBottom: '32px' }}>
        <div>
          <div className="kicker">Support</div>
          <h3 style={{ borderBottom: 'none', margin: 0, padding: 0 }}>Frequently Asked Questions</h3>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {FAQS.map((faq, i) => (
          <div 
            key={i} 
            style={{ 
              border: '1px solid var(--line)', 
              borderRadius: '8px', 
              overflow: 'hidden',
              transition: 'all var(--motion)'
            }}
          >
            <button 
              onClick={() => toggle(i)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 24px',
                background: openIdx === i ? 'rgba(9, 79, 168, 0.04)' : '#fff',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--navy)'
              }}
            >
              {faq.question}
              <svg 
                className="ic sm" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                style={{
                  transform: openIdx === i ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform var(--motion)'
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <div 
              style={{ 
                maxHeight: openIdx === i ? '500px' : '0', 
                opacity: openIdx === i ? 1 : 0,
                padding: openIdx === i ? '0 24px 20px' : '0 24px',
                background: openIdx === i ? 'rgba(9, 79, 168, 0.04)' : '#fff',
                transition: 'all 0.3s ease-in-out',
                color: 'var(--muted)',
                fontSize: '14px',
                lineHeight: '1.6'
              }}
            >
              {faq.answer}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
