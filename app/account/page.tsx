import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCustomerAccountData } from '@/lib/shopify-customer';
import { getWishlist } from '@/app/actions/wishlist';
import { getAllProducts } from '@/lib/shopify-api';
import WishlistGrid, { WishlistCountBadge } from '@/components/account/WishlistGrid';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AccountPage() {
  const { isLoggedIn, customer } = await getCustomerAccountData();

  if (!isLoggedIn || !customer) {
    redirect('/api/auth/login');
  }

  const wishlistIds = await getWishlist();
  const { products: allProducts } = await getAllProducts({ first: 250 });
  const wishlistedProducts = allProducts.filter((p) =>
    wishlistIds.includes(p.id) || wishlistIds.some((id) => p.id.endsWith('/' + id) || id.endsWith('/' + p.id))
  );

  const orders = customer.orders || [];

  return (
    <div className="store-frame" style={{ padding: '40px 28px 64px', minHeight: '70vh' }}>
      {/* Breadcrumb */}
      <div className="breadcrumb" style={{ padding: '0 0 20px' }}>
        <Link href="/">Home</Link> / <span>Customer Account</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '28px', borderBottom: '1px solid var(--line)', paddingBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--imperial-blue)', fontWeight: 700 }}>
            Customer Portal
          </div>
          <h1 style={{ color: 'var(--navy)', fontSize: '28px', margin: '6px 0 4px' }}>
            Welcome back, {customer.displayName}!
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0 }}>
            {customer.email || 'Logged in via Shopify Customer Account'}
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
                background: 'var(--navy)',
                color: '#fff',
                padding: '10px 14px',
                borderRadius: 'var(--r-soft)',
                fontSize: '12.5px',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>Dashboard</span>
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
                alignItems: 'center',
                transition: 'background var(--motion)'
              }}
            >
              <span>Wishlist</span>
              <WishlistCountBadge
                initialCount={wishlistIds.length}
                style={{ background: 'var(--slot)', color: 'var(--navy)', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px' }}
              />
            </Link>
            <Link
              href="/account/orders"
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
              <span>Order History</span>
              {orders.length > 0 && (
                <span style={{ background: 'var(--slot)', color: 'var(--navy)', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px' }}>
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

        {/* Main Content Area */}
        <div style={{ flex: 1, minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ background: '#fff', padding: '20px', borderRadius: 'var(--r-card)', boxShadow: 'var(--sh-soft)' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700, letterSpacing: '0.08em' }}>
                Account Email
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--navy)', marginTop: '8px', wordBreak: 'break-all' }}>
                {customer.email || 'Verified Buyer'}
              </div>
            </div>

            <div style={{ background: '#fff', padding: '20px', borderRadius: 'var(--r-card)', boxShadow: 'var(--sh-soft)' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700, letterSpacing: '0.08em' }}>
                Saved in Wishlist
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--navy)', marginTop: '4px' }}>
                <WishlistCountBadge initialCount={wishlistIds.length} showZero={true} />
              </div>
              <Link href="/account/wishlist" style={{ fontSize: '11.5px', color: 'var(--imperial-blue)', fontWeight: 600, textDecoration: 'none' }}>
                View wishlist →
              </Link>
            </div>

            <div style={{ background: '#fff', padding: '20px', borderRadius: 'var(--r-card)', boxShadow: 'var(--sh-soft)' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700, letterSpacing: '0.08em' }}>
                Orders Placed
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--navy)', marginTop: '4px' }}>
                {orders.length}
              </div>
              <Link href="/account/orders" style={{ fontSize: '11.5px', color: 'var(--imperial-blue)', fontWeight: 600, textDecoration: 'none' }}>
                View orders →
              </Link>
            </div>
          </div>

          {/* Default Address Section */}
          {customer.defaultAddress && (
            <div style={{ background: '#fff', padding: '22px', borderRadius: 'var(--r-card)', boxShadow: 'var(--sh-soft)' }}>
              <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--navy)', margin: '0 0 12px' }}>
                Delivery Address
              </h3>
              <p style={{ color: 'var(--text)', fontSize: '13.5px', margin: 0, lineHeight: 1.6 }}>
                {customer.defaultAddress.formatted?.join(', ') || [
                  customer.defaultAddress.address1,
                  customer.defaultAddress.city,
                  customer.defaultAddress.country
                ].filter(Boolean).join(', ')}
              </p>
            </div>
          )}

          {/* Recent Orders Section */}
          <div style={{ background: '#fff', padding: '24px', borderRadius: 'var(--r-card)', boxShadow: 'var(--sh-soft)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', color: 'var(--navy)', margin: 0, fontWeight: 700 }}>
                Recent Orders
              </h3>
              {orders.length > 0 && (
                <Link href="/account/orders" style={{ fontSize: '12px', color: 'var(--imperial-blue)', textDecoration: 'none', fontWeight: 600 }}>
                  View all ({orders.length}) →
                </Link>
              )}
            </div>

            {orders.length === 0 ? (
              <div style={{ padding: '24px 0', color: 'var(--muted)', fontSize: '13.5px' }}>
                <p style={{ margin: '0 0 14px' }}>You have not placed any orders through this account yet.</p>
                <Link href="/products" className="btn primary" style={{ fontSize: '12px', padding: '10px 18px' }}>
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {orders.slice(0, 3).map((order) => (
                  <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'var(--slot)', borderRadius: 'var(--r-soft)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--navy)' }}>
                        {order.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                        {new Date(order.processedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--navy)' }}>
                        {order.totalPrice ? `${order.totalPrice.amount} ${order.totalPrice.currencyCode}` : '—'}
                      </div>
                      <span style={{ display: 'inline-block', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', padding: '2px 8px', borderRadius: '6px', background: '#eef8f2', color: 'var(--uae-green)', marginTop: '4px' }}>
                        {order.fulfillmentStatus || order.financialStatus || 'Confirmed'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Wishlist Preview */}
          <div style={{ background: '#fff', padding: '24px', borderRadius: 'var(--r-card)', boxShadow: 'var(--sh-soft)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '15px', color: 'var(--navy)', margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Wishlist</span>
                  <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>
                    (<WishlistCountBadge initialCount={wishlistIds.length} showZero={true} />)
                  </span>
                </h3>
                <span style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
                  Items you saved for project consideration
                </span>
              </div>
              <Link href="/account/wishlist" style={{ fontSize: '12px', color: 'var(--imperial-blue)', textDecoration: 'none', fontWeight: 600 }}>
                Manage all →
              </Link>
            </div>

            <WishlistGrid
              initialProducts={wishlistedProducts}
              catalogProducts={allProducts}
              maxItems={4}
              compact={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
