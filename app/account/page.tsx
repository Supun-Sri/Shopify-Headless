import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AccountPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('customer_access_token')?.value;

  if (!token) {
    redirect('/api/auth/login');
  }

  // Here you would normally fetch the customer's details from Shopify Customer API using the token
  // For now we'll render a placeholder dashboard
  return (
    <div className="store-frame" style={{ padding: '60px 28px', minHeight: '60vh' }}>
      <h1 style={{ color: 'var(--navy)', marginBottom: '32px', fontSize: '28px', borderBottom: '1px solid var(--line)', paddingBottom: '16px' }}>
        My Account
      </h1>
      
      <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
        {/* Sidebar */}
        <div style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link href="/account" style={{ fontWeight: 600, color: 'var(--navy)', textDecoration: 'none' }}>Dashboard</Link>
          <Link href="/account/wishlist" style={{ color: 'var(--text)', textDecoration: 'none' }}>Wishlist</Link>
          <Link href="/account/orders" style={{ color: 'var(--text)', textDecoration: 'none' }}>Order History</Link>
          <a href="/api/auth/logout" style={{ color: 'var(--signal-red)', textDecoration: 'none', marginTop: '20px' }}>Log out</a>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, minWidth: '300px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Welcome back!</h2>
          <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>
            Manage your orders, wishlists, and account details here.
          </p>

          <div style={{ padding: '24px', border: '1px solid var(--line)', borderRadius: '4px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Recent Orders</h3>
            <p style={{ color: 'var(--muted)', fontSize: '14px' }}>You haven't placed any orders yet.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
