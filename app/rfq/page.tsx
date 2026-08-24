import type { Metadata } from 'next';
import RFQForm from '@/components/rfq/RFQForm';

export const metadata: Metadata = {
  title: 'Request a Quote',
  description: 'Request a project quote for construction chemicals, building materials and tools. UAE supply, fast response.',
};

export default function RFQPage() {
  return (
    <div className="rfq-wrap">
      <h1>Request a Quote</h1>
      <p className="rfq-subtitle">
        Tell us the material, quantity and project location. Our team will confirm availability and quotation options within 24 hours.
      </p>

      {/* Product context placeholder */}
      <div className="rfq-product">
        <div className="rfq-product-ph" aria-hidden="true" />
        <div className="rfq-product-name">
          General / Multiple Products
          <small>You can specify multiple products below</small>
        </div>
      </div>

      <RFQForm />
    </div>
  );
}
