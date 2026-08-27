import type { Metadata } from 'next';
import BulkInquiryForm from '@/components/bulk-inquiries/BulkInquiryForm';
import { getAllProducts } from '@/lib/shopify-api';

export const metadata: Metadata = {
  title: 'Bulk Inquiries',
  description: 'Submit bulk inquiries for wholesale construction materials, chemicals, and tools.',
};

export default async function BulkInquiriesPage() {
  const { products } = await getAllProducts({ first: 250 });

  return (
    <div className="rfq-wrap">
      <h1>Bulk Inquiries</h1>
      <p className="rfq-subtitle">
        Looking for high volumes or B2B pricing? Select your products and upload your project documents below for a custom quotation.
      </p>

      <BulkInquiryForm products={products} />
    </div>
  );
}
