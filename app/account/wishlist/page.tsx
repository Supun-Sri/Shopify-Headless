import { getWishlist } from '@/app/actions/wishlist';
import { getAllProducts } from '@/lib/shopify-api';
import ProductCard from '@/components/products/ProductCard';
import Link from 'next/link';

export default async function WishlistPage() {
  const itemIds = await getWishlist();
  
  // Quick fetch logic (in a real app, query specifically by these IDs)
  // For the prototype, we fetch all and filter, or if empty, skip.
  let products: any[] = [];
  if (itemIds.length > 0) {
    const { products: all } = await getAllProducts({ first: 250 });
    products = all.filter(p => itemIds.includes(p.id));
  }

  return (
    <div className="store-frame" style={{ padding: '60px 28px', minHeight: '60vh' }}>
      <h1 style={{ color: 'var(--navy)', marginBottom: '32px', fontSize: '28px', borderBottom: '1px solid var(--line)', paddingBottom: '16px' }}>
        My Wishlist
      </h1>
      
      <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
        {/* Sidebar */}
        <div style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link href="/account" style={{ color: 'var(--text)', textDecoration: 'none' }}>Dashboard</Link>
          <Link href="/account/wishlist" style={{ fontWeight: 600, color: 'var(--navy)', textDecoration: 'none' }}>Wishlist</Link>
          <Link href="/account/orders" style={{ color: 'var(--text)', textDecoration: 'none' }}>Order History</Link>
          <a href="/api/auth/logout" style={{ color: 'var(--signal-red)', textDecoration: 'none', marginTop: '20px' }}>Log out</a>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, minWidth: '300px' }}>
          {products.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed var(--line)', borderRadius: '4px' }}>
              <p style={{ color: 'var(--muted)', marginBottom: '16px' }}>Your wishlist is empty.</p>
              <Link href="/products" className="btn secondary">Browse Products</Link>
            </div>
          ) : (
            <div className="prodgrid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
