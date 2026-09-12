import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getAllProducts } from '@/lib/shopify-api';
import type { ShopifyProduct } from '@/lib/types';
import CoverageCalculatorClient from '@/components/calculator/CoverageCalculatorClient';

export const metadata: Metadata = {
  title: 'Coverage Calculator | Grouts & Sealants | Imperial Middle East',
  description:
    'Calculate exact material consumption, volume, and required packaging for tile grouting and joint sealing according to international construction standards.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CoverageCalculatorPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('customer_access_token')?.value;
  const idToken = cookieStore.get('customer_id_token')?.value;
  const isLoggedIn = !!(accessToken || idToken);

  let products: ShopifyProduct[] = [];
  try {
    const res = await getAllProducts({ first: 50 });
    products = res.products || [];
  } catch (error) {
    console.error('Failed to load products for calculator:', error);
  }

  return <CoverageCalculatorClient products={products} isLoggedIn={isLoggedIn} />;
}
