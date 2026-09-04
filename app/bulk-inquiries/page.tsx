import type { Metadata } from 'next';
import BulkInquiryForm from '@/components/bulk-inquiries/BulkInquiryForm';
import { getAllProducts } from '@/lib/shopify-api';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Bulk Inquiries | IMPERIAL',
  description: 'Submit bulk inquiries for wholesale construction materials, chemicals, and tools.',
};

export default async function BulkInquiriesPage() {
  const { products } = await getAllProducts({ first: 250 });

  return (
    <>
      <div className="breadcrumb">
        <Link href="/">Home</Link> / <span>Bulk Inquiries</span>
      </div>

      <div className="rfqwrap">
        <div className="kicker">Trade &amp; Bulk</div>
        <h1>Bulk Inquiries</h1>
        <div className="sub">
          Looking for high volumes, pallet orders, or contract pricing? Select your products and submit your project specs below.
        </div>

        <BulkInquiryForm products={products} />
      </div>
    </>
  );
}
