import Link from 'next/link';
import Image from 'next/image';
import { getAllProducts, getCollections } from '@/lib/shopify-api';
import ProductCard from '@/components/products/ProductCard';
import HeroSection from '@/components/home/HeroSection';
import type { Metadata } from 'next';

// ISR: revalidate at most every 60 s, plus on-demand via /api/revalidate webhook
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'IMPERIAL — Materials. Systems. Project confidence.',
  description:
    'Technical products, responsive support and reliable UAE supply for demanding construction environments.',
};


export default async function HomePage() {
  const [collectionsResult, productsResult] = await Promise.allSettled([
    getCollections(8),
    getAllProducts({ first: 8, sortKey: 'BEST_SELLING' }),
  ]);

  const collections = collectionsResult.status === 'fulfilled' ? collectionsResult.value : [];
  const products = productsResult.status === 'fulfilled' ? productsResult.value.products : [];

  // Fallback category tiles if no collections exist
  const FALLBACK_CATEGORIES = [
    { icon: '⬛', label: 'Construction Chemicals', href: '/products' },
    { icon: '▦', label: 'Gypsum & Ceiling', href: '/products' },
    { icon: '🧱', label: 'Building Materials', href: '/products' },
    { icon: '🔧', label: 'Tools & Equipment', href: '/products' },
  ];

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Imperial Middle East',
            url: 'https://imperial.ae',
            description: 'Materials. Systems. Project confidence.',
          }),
        }}
      />

      {/* Hero */}
      <HeroSection />

      {/* Shop by Category — real collections or fallback */}
      <div className="section reveal">
        <div className="section-head">
          <h2>Shop by Category</h2>
          {collections.length > 0 && (
            <Link href="/collections" className="section-link">View all →</Link>
          )}
        </div>
        <div className="catgrid">
          {collections.length > 0
            ? collections.slice(0, 8).map((col) => (
                <Link key={col.id} href={`/products?collection=${col.handle}`} className="cattile">
                  {/* Collection image */}
                  <div className="cattile-img">
                    {col.image ? (
                      <Image
                        src={col.image.url}
                        alt={col.image.altText || col.title}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 180px"
                        style={{ objectFit: 'contain', mixBlendMode: 'multiply' }}
                      />
                    ) : (
                      <div className="cattile-img-placeholder" aria-hidden="true">📦</div>
                    )}
                    <div className="cattile-img-overlay" aria-hidden="true" />
                  </div>
                  <span className="cattile-label">{col.title}</span>
                </Link>
              ))
            : FALLBACK_CATEGORIES.map((cat) => (
                <Link key={cat.label} href={cat.href} className="cattile">
                  <div className="cattile-img cattile-img-fallback" aria-hidden="true">
                    <span>{cat.icon}</span>
                  </div>
                  <span className="cattile-label">{cat.label}</span>
                </Link>
              ))
          }
        </div>
      </div>

      {/* Featured Products */}
      <div className="section reveal">
        <h2>
          Featured Products
          <span className="tag">Best Selling</span>
        </h2>
        {products.length > 0 ? (
          <div className="prodgrid">
            {products.slice(0, 8).map((product, i) => (
              <ProductCard key={product.id} product={product} priority={i < 4} />
            ))}
          </div>
        ) : (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--muted)' }}>
            <p>Connect your Shopify store to display featured products.</p>
            <Link
              href="/products"
              className="btn-primary"
              style={{ display: 'inline-block', marginTop: '20px', textDecoration: 'none' }}
            >
              Browse All Products
            </Link>
          </div>
        )}
      </div>

      {/* Why Imperial */}
      <div className="section reveal">
        <h2>Why Imperial</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
          }}
        >
          {[
            { icon: '🏗', title: 'Project Ready', desc: 'Stocked for UAE construction volumes with fast dispatch from Al Quoz.' },
            { icon: '📄', title: 'Full Documentation', desc: 'Technical data sheets, safety data sheets and application guides on every product.' },
            { icon: '💬', title: 'Expert Support', desc: 'Chat with a product specialist or send an inquiry — response within 24 hours.' },
            { icon: '🤝', title: 'Negotiate & Quote', desc: 'Bulk pricing and project quotes available directly through the platform.' },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                border: '1px solid var(--line)', borderRadius: 'var(--r-card)',
                padding: '20px', background: '#fff',
              }}
            >
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>{item.icon}</div>
              <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '6px', color: 'var(--navy)' }}>{item.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.6 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews */}
      <div className="section reveal">
        <h2>
          Reviews with Photos
          <span className="tag">Verified</span>
        </h2>
        <div className="prodgrid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {[
            { stars: '★★★★★', buyer: 'Verified Buyer', text: '"Fast delivery, exactly the tile adhesive we needed for the job site."' },
            { stars: '★★★★☆', buyer: 'Verified Buyer', text: '"Responsive team, easy to get technical data sheets before ordering."' },
            { stars: '★★★★★', buyer: 'Verified Buyer', text: '"Used on a 400sqm villa floor — zero lippage issues. Will reorder."' },
          ].map((review, i) => (
            <div
              key={i}
              style={{ border: '1px solid var(--line)', borderRadius: 'var(--r-card)', background: '#fff', padding: '18px' }}
            >
              <div style={{ fontSize: '10px', color: 'var(--silver)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', fontWeight: 600 }}>
                {review.stars} — {review.buyer}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, lineHeight: 1.5, color: 'var(--text)' }}>{review.text}</div>
            </div>
          ))}
        </div>
      </div>

      {/* RFQ CTA Banner */}
      <div className="section reveal">
        <div
          style={{
            background: 'var(--navy)', borderRadius: 'var(--r-panel)',
            padding: '40px 36px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px',
          }}
        >
          <div>
            <div style={{ fontSize: '10.5px', color: 'var(--electric-blue)', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700, marginBottom: '8px' }}>
              Trade &amp; Project
            </div>
            <h3 style={{ color: '#fff', margin: 0, fontSize: '22px', letterSpacing: '-0.02em', borderBottom: 'none', paddingBottom: 0 }}>
              Need quantities? Get a project quote.
            </h3>
            <p style={{ color: '#95a7bd', fontSize: '13px', margin: '8px 0 0', lineHeight: 1.6 }}>
              Tell us the material, quantity and project location. Our team confirms availability and pricing.
            </p>
          </div>
          <Link
            href="/rfq"
            className="btn-primary"
            style={{ textDecoration: 'none', flexShrink: 0 }}
          >
            Request a Quote →
          </Link>
        </div>
      </div>
    </>
  );
}
