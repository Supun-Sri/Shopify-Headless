import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCustomerAccountData } from '@/lib/shopify-customer';
import { getWishlist } from '@/app/actions/wishlist';

export const revalidate = 0;

export default async function OrdersPage() {
  const { isLoggedIn, customer } = await getCustomerAccountData();

  if (!isLoggedIn || !customer) {
    redirect('/api/auth/login');
  }

  const wishlistIds = await getWishlist();
  const orders = customer.orders || [];

  return (
    <div className="store-frame" style={{ padding: '40px 28px 64px', minHeight: '70vh' }}>
      {/* Breadcrumb */}
      <div className="breadcrumb" style={{ padding: '0 0 20px' }}>
        <Link href="/">Home</Link> / <Link href="/account">Account</Link> / <span>Orders</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '28px', borderBottom: '1px solid var(--line)', paddingBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--imperial-blue)', fontWeight: 700 }}>
            Purchases &amp; Deliveries
          </div>
          <h1 style={{ color: 'var(--navy)', fontSize: '28px', margin: '6px 0 4px' }}>
            Order History
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0 }}>
            Review past orders, delivery tracking, and invoice receipts.
          </p>
        </div>

        <a href="/api/auth/logout" className="btn secondary" style={{ fontSize: '12px', padding: '9px 16px' }}>
          Sign Out
        </a>
      </div>

      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Sidebar */}
        <aside style={{ width: '240px', flexShrink: 0 }}>
          <div style={{ background: '#fff', borderRadius: 'var(--r-card)', boxShadow: 'var(--sh-soft)', padding: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Link
              href="/account"
              style={{
                color: 'var(--text)',
                padding: '10px 14px',
                borderRadius: 'var(--r-soft)',
                fontSize: '12.5px',
                fontWeight: 500,
                textDecoration: 'none'
              }}
            >
              Dashboard
            </Link>
            <Link
              href="/account/wishlist"
              style={{
                color: 'var(--text)',
                padding: '10px 14px',
                borderRadius: 'var(--r-soft)',
                fontSize: '12.5px',
                fontWeight: 500,
                textDecoration: 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>Wishlist</span>
              {wishlistIds.length > 0 && (
                <span style={{ background: 'var(--slot)', color: 'var(--navy)', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px' }}>
                  {wishlistIds.length}
                </span>
              )}
            </Link>
            <Link
              href="/account/orders"
              style={{
                background: 'var(--navy)',
                color: '#fff',
                padding: '10px 14px',
                borderRadius: 'var(--r-soft)',
                fontSize: '12.5px',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>Order History</span>
              {orders.length > 0 && (
                <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px' }}>
                  {orders.length}
                </span>
              )}
            </Link>
            <Link
              href="/rfq"
              style={{
                color: 'var(--text)',
                padding: '10px 14px',
                borderRadius: 'var(--r-soft)',
                fontSize: '12.5px',
                fontWeight: 500,
                textDecoration: 'none'
              }}
            >
              Request a Quote
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <div style={{ flex: 1, minWidth: '320px' }}>
          {orders.length === 0 ? (
            <div style={{ background: '#fff', padding: '56px 24px', textAlign: 'center', borderRadius: 'var(--r-card)', boxShadow: 'var(--sh-soft)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px', color: 'var(--silver)' }}>📦</div>
              <h2 style={{ fontSize: '20px', color: 'var(--navy)', marginBottom: '8px' }}>No orders found</h2>
              <p style={{ color: 'var(--muted)', marginBottom: '24px', maxWidth: '420px', margin: '0 auto 24px', lineHeight: 1.6 }}>
                You have not placed any orders yet. Place your first order or send a quote inquiry to see details here.
              </p>
              <Link href="/products" className="btn primary">
                Browse Catalogue
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {orders.map((order) => (
                <div key={order.id} style={{ background: '#fff', borderRadius: 'var(--r-card)', boxShadow: 'var(--sh-soft)', padding: '20px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--line)', paddingBottom: '14px', marginBottom: '14px' }}>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy)' }}>
                        Order {order.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                        Placed on {new Date(order.processedAt).toLocaleDateString('en-AE', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy)' }}>
                        {order.totalPrice ? `${order.totalPrice.amount} ${order.totalPrice.currencyCode}` : '—'}
                      </div>
                      <span style={{ display: 'inline-block', fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', padding: '3px 10px', borderRadius: '6px', background: '#eef8f2', color: 'var(--uae-green)', marginTop: '4px' }}>
                        {order.fulfillmentStatus || order.financialStatus || 'Confirmed'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
