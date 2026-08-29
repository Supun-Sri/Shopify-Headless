import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Promotions | Imperial',
  description: 'View current promotions and special offers from Imperial Middle East.',
};

export default function PromotionsPage() {
  return (
    <>
      <div className="breadcrumb">
        <Link href="/">Home</Link> / Promotions
      </div>

      <div className="store-frame" style={{ padding: '60px 28px', minHeight: '50vh', textAlign: 'center' }}>
        <h1 style={{ color: 'var(--navy)', marginBottom: '24px', fontSize: '32px' }}>
          Promotions & Special Offers
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '15px', maxWidth: '600px', margin: '0 auto 40px' }}>
          We are currently curating our latest promotional offers and product discounts. Please check back later to see our upcoming deals.
        </p>
        
        <Link href="/products" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none', padding: '14px 28px', fontSize: '14px' }}>
          Browse All Products
        </Link>
      </div>
    </>
  );
}
