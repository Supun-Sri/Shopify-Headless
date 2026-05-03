import Link from 'next/link';
import Image from 'next/image';
import { getAllProducts, getCollections } from '@/lib/shopify-api';
import ProductCard from '@/components/products/ProductCard';
import HeroSection from '@/components/home/HeroSection';

// Hero images from design reference
const HERO_IMG = '/Hero image.jpg';

export default async function HomePage() {
  // Fetch real data from Shopify
  const [collectionsResult, productsResult] = await Promise.allSettled([
    getCollections(10),
    getAllProducts({ first: 8, sortKey: 'BEST_SELLING' })
  ]);

  const collections = collectionsResult.status === 'fulfilled' ? collectionsResult.value : [];
  const products = productsResult.status === 'fulfilled' ? productsResult.value.products : [];
  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'MAISON',
            url: 'https://maison.com',
            description: 'Architectural silhouettes and noble materials.',
          }),
        }}
      />

      {/* Hero */}
      <HeroSection imageUrl={HERO_IMG} />

      {/* Categories Bento */}
      <section className="section section-gap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px' }}>
          <div style={{ maxWidth: '560px' }}>
            <h2 className="text-headline-lg">A Curated Perspective</h2>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', lineHeight: 1.6, color: '#444748', marginTop: '12px' }}>
              Exploring the intersection of architectural form and wearable art. Each category is a dedicated study in silhouette and material integrity.
            </p>
          </div>
          <Link href="/products" className="text-label" style={{ borderBottom: '1px solid var(--color-charcoal)', paddingBottom: '4px', textDecoration: 'none', color: 'var(--color-charcoal)', display: 'none' }} id="view-all-categories">
            View All Categories
          </Link>
        </div>
        {collections.length > 0 ? (
          <div className="bento-grid" style={{ height: 'auto' }}>
            {collections.slice(0, 3).map((collection, index) => {
              const gridSpan = index === 0 ? 7 : index === 1 ? 5 : 12;
              const height = index === 2 ? '400px' : '500px';
              return (
                <Link 
                  key={collection.id} 
                  href={`/products?collection=${collection.handle}`}
                  className="bento-item" 
                  style={{ gridColumn: `span ${gridSpan}`, height }}
                >
                  {collection.image ? (
                    <Image 
                      src={collection.image.url} 
                      alt={collection.image.altText || collection.title} 
                      fill 
                      sizes={index === 2 ? "100vw" : index === 0 ? "(max-width: 768px) 100vw, 58vw" : "(max-width: 768px) 100vw, 42vw"} 
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'var(--color-surface-container)' }} />
                  )}
                  <div className="bento-label">
                    <h3>{collection.title}</h3>
                    {collection.description && <p>{collection.description.substring(0, 50)}</p>}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bento-grid" style={{ height: 'auto' }}>
            <div className="bento-item" style={{ gridColumn: 'span 12', height: '400px', background: 'var(--color-surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: 'var(--color-grey)' }}>No collections available</p>
            </div>
          </div>
        )}
      </section>

      {/* The Archive — Featured Products */}
      <section className="section section-gap">
        <div className="section-header">
          <h2>The Archive</h2>
          <p>Timeless essentials for the discerning eye</p>
        </div>
        {products.length > 0 ? (
          <div className="products-grid">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} priority={i < 4} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <p style={{ color: 'var(--color-grey)', marginBottom: '24px' }}>No products available</p>
            <Link href="/products" style={{ display: 'inline-block', background: 'var(--color-charcoal)', color: 'var(--color-white)', padding: '16px 40px', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.2em', textDecoration: 'none' }}>
              Browse All Products
            </Link>
          </div>
        )}
      </section>

      {/* Newsletter */}
      <section className="newsletter section-gap">
        <div className="newsletter-inner">
          <span className="text-label" style={{ color: 'var(--color-gold)', marginBottom: '24px', display: 'block' }}>The Correspondence</span>
          <h2>Stay Stylish</h2>
        </div>
      </section>
    </>
  );
}
