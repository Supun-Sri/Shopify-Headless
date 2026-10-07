import { NextResponse } from 'next/server';
import { getAllProducts, getProductFilters } from '@/lib/shopify-api';
import { planProductSearch } from '@/lib/product-search';

export const runtime = 'nodejs';

const MIN_QUERY_LENGTH = 2;
const MAX_PRODUCTS = 6;
const MAX_QUICK_LINKS = 3;

function titleCaseType(type: string): string {
  return type
    .toLowerCase()
    .split(' ')
    .map((w) => (w === '&' ? '&' : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}

function matchesTerm(value: string, term: string): boolean {
  const v = value.toLowerCase();
  const t = term.toLowerCase();
  if (!t) return false;
  return v.includes(t) || t.includes(v) || v.startsWith(t.slice(0, Math.min(4, t.length)));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = (searchParams.get('q') || '').trim();

  if (raw.length < MIN_QUERY_LENGTH) {
    return NextResponse.json({
      query: raw,
      corrected: null,
      didYouMean: false,
      products: [],
      categories: [],
      brands: [],
    });
  }

  try {
    const filters = await getProductFilters();
    const dict = [...filters.productTypes, ...filters.vendors, ...filters.tags];
    const plan = planProductSearch(raw, dict);

    if (!plan) {
      return NextResponse.json({
        query: raw,
        corrected: null,
        didYouMean: false,
        products: [],
        categories: [],
        brands: [],
      });
    }

    let { products } = await getAllProducts({
      first: MAX_PRODUCTS,
      sortKey: 'RELEVANCE',
      query: plan.primary,
    });

    if (products.length === 0) {
      const loose = await getAllProducts({
        first: MAX_PRODUCTS,
        sortKey: 'RELEVANCE',
        query: plan.loose,
      });
      products = loose.products;
    }

    const stem = plan.corrected.split(/\s+/)[0] || plan.corrected;

    const categories = filters.productTypes
      .filter((t) => matchesTerm(t, stem) || matchesTerm(t, plan.corrected))
      .slice(0, MAX_QUICK_LINKS)
      .map((t) => ({
        label: titleCaseType(t),
        href: `/products?type=${encodeURIComponent(t)}`,
      }));

    const brands = filters.vendors
      .filter((v) => matchesTerm(v, stem) || matchesTerm(v, plan.corrected))
      .slice(0, MAX_QUICK_LINKS)
      .map((v) => ({
        label: v,
        href: `/products?vendor=${encodeURIComponent(v)}`,
      }));

    const didYouMean =
      plan.corrected.replace(/\s+/g, ' ') !== raw.trim().toLowerCase().replace(/\s+/g, ' ');

    return NextResponse.json({
      query: raw,
      corrected: plan.corrected,
      didYouMean,
      products: products.map((p) => ({
        id: p.id,
        title: p.title,
        handle: p.handle,
        vendor: p.vendor,
        productType: p.productType,
        imageUrl: p.images[0]?.url ?? null,
        price: p.priceRange.minVariantPrice,
      })),
      categories,
      brands,
    });
  } catch (err) {
    console.error('search suggest failed:', err);
    return NextResponse.json(
      {
        query: raw,
        corrected: null,
        didYouMean: false,
        products: [],
        categories: [],
        brands: [],
        error: 'Failed to load suggestions',
      },
      { status: 500 }
    );
  }
}
