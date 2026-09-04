import type { Metadata } from 'next';
import RFQForm from '@/components/rfq/RFQForm';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Request a Quote | IMPERIAL',
  description: 'Request a project quote for construction chemicals, building materials and tools. UAE supply, fast response.',
};

export default function RFQPage() {
  return (
    <>
      <div className="breadcrumb">
        <Link href="/">Home</Link> / <span>Request a Quote</span>
      </div>

      <div className="rfqwrap">
        <div className="kicker">Trade</div>
        <h1>Request a Quote</h1>
        <div className="sub">
          Tell us the material, quantity and project location. Our team will confirm availability and quotation options within 24 hours.
        </div>

        {/* Product context preview */}
        <div className="rfqproduct">
          <div className="ph">
            <svg className="ic lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <div className="n">
            General Trade &amp; Project Inquiries
            <small>Specify particular materials, brands, or multiple SKUs below</small>
          </div>
        </div>

        <RFQForm />
      </div>
    </>
  );
}
