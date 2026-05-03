import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductByHandle } from '@/lib/shopify-api';
import { formatPrice } from '@/lib/utils';
import ProductDetailClient from './ProductDetailClient';

interface PageProps {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { handle } = await params;
    const product = await getProductByHandle(handle);
    if (!product) return { title: 'Product Not Found' };
    return {
      title: product.title,
      description: product.description?.slice(0, 160),
      openGraph: {
        title: `${product.title} | MAISON`,
        description: product.description?.slice(0, 160),
        images: product.images[0] ? [{ url: product.images[0].url }] : [],
      },
    };
  } catch {
    return { title: 'Product' };
  }
}

export default async function ProductPage({ params }: PageProps) {
  let product;
  try {
    const { handle } = await params;
    product = await getProductByHandle(handle);
  } catch {
    // Shopify not connected — show placeholder
    return <PlaceholderProduct />;
  }

  if (!product) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: product.images[0]?.url,
    offers: {
      '@type': 'Offer',
      price: product.priceRange.minVariantPrice.amount,
      priceCurrency: product.priceRange.minVariantPrice.currencyCode,
      availability: product.availableForSale
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductDetailClient product={product} />
    </>
  );
}

function PlaceholderProduct() {
  return (
    <div className="error-page" style={{ minHeight: '50vh' }}>
      <h2 className="text-headline-lg">Connect Your Store</h2>
      <p>Add your Shopify credentials to .env.local to view product details.</p>
    </div>
  );
}
