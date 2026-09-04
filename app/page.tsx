import Link from 'next/link';
import { getAllProducts, getCollections } from '@/lib/shopify-api';
import ProductCard from '@/components/products/ProductCard';
import HeroSection from '@/components/home/HeroSection';
import type { Metadata } from 'next';

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

  const CATEGORIES = [
    {
      title: 'Construction Chemicals',
      href: '/products?collection=construction-chemicals',
      icon: (
        <svg className="ic lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
        </svg>
      ),
    },
    {
      title: 'Gypsum & Ceiling',
      href: '/products?collection=gypsum-ceiling',
      icon: (
        <svg className="ic lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      ),
    },
    {
      title: 'Building Materials',
      href: '/products?collection=building-materials',
      icon: (
        <svg className="ic lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
          <line x1="12" y1="10" x2="12" y2="20" />
        </svg>
      ),
    },
    {
      title: 'Tools & Equipment',
      href: '/products?collection=tools',
      icon: (
        <svg className="ic lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      ),
    },
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

      {/* Hero Section */}
      <HeroSection />

      {/* Shop by Category */}
      <div className="section">
        <div className="sectionhead">
          <div>
            <div className="kicker">Explore</div>
            <h3>Shop by Category</h3>
          </div>
          <Link href="/products" className="viewall">
            <span className="dot">
              <svg className="ic sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </span>
            View all
          </Link>
        </div>
        <div className="catgrid">
          {CATEGORIES.map((cat) => (
            <Link key={cat.title} href={cat.href} className="cattile">
              <div className="icon-box">{cat.icon}</div>
              <span>{cat.title}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Products */}
      <div className="section">
        <div className="sectionhead">
          <div>
            <div className="kicker">Curated</div>
            <h3>Featured Products</h3>
          </div>
          <Link href="/products" className="viewall">
            <span className="dot">
              <svg className="ic sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </span>
            View all
          </Link>
        </div>

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
              className="btn primary"
              style={{ display: 'inline-block', marginTop: '20px' }}
            >
              Browse All Products
            </Link>
          </div>
        )}
      </div>

      {/* Reviews with Photos */}
      <div className="section">
        <div className="kicker">Feedback</div>
        <h3>
          Reviews with Photos <span className="tag">Verified</span>
        </h3>
        <div className="reviewgrid">
          <div className="reviewcard">
            <span className="stars">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="ic sm fill" viewBox="0 0 24 24">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
            </span>
            <p className="quote">“Fast delivery, exactly the tile adhesive we needed for the job site.”</p>
            <div className="who">Verified buyer · Dubai</div>
          </div>

          <div className="reviewcard">
            <span className="stars">
              {[...Array(4)].map((_, i) => (
                <svg key={i} className="ic sm fill" viewBox="0 0 24 24">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
              <svg className="ic sm fill off" viewBox="0 0 24 24">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </span>
            <p className="quote">“Responsive team, easy to get technical data sheets before ordering.”</p>
            <div className="who">Verified buyer · Sharjah</div>
          </div>

          <div className="reviewcard">
            <div className="shot">
              <svg className="ic xl" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <p className="quote">“Used on a 400 sqm villa floor — zero lippage issues.”</p>
            <div className="who">Verified buyer · Abu Dhabi</div>
          </div>
        </div>
      </div>
    </>
  );
}
