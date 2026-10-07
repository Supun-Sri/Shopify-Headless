import { NextResponse } from 'next/server';
import { getAllProducts } from '@/lib/shopify-api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ products: [] });
  }

  try {
    const result = await getAllProducts({ query: q, first: 6 });
    return NextResponse.json({ products: result.products });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ products: [] }, { status: 500 });
  }
}
