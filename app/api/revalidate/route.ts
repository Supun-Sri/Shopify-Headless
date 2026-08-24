import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Shopify sends an HMAC-SHA256 signature in X-Shopify-Hmac-SHA256
// Set SHOPIFY_WEBHOOK_SECRET in .env.local to the secret shown in Shopify admin
// Partners > Apps > Webhooks > select a webhook > Secret
const WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET ?? '';

// Verify the request actually came from Shopify
async function verifyShopifyWebhook(req: NextRequest, body: string): Promise<boolean> {
  if (!WEBHOOK_SECRET) return true; // skip verification in dev if secret not set

  const hmacHeader = req.headers.get('x-shopify-hmac-sha256');
  if (!hmacHeader) return false;

  const digest = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(body, 'utf8')
    .digest('base64');

  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmacHeader));
}

// Map Shopify webhook topics to the Next.js cache tags they should bust
function tagsForTopic(topic: string): string[] {
  if (topic.startsWith('products/')) {
    return ['products', 'product-filters'];
  }
  if (topic.startsWith('collections/')) {
    return ['collections', 'products'];
  }
  if (topic.startsWith('inventory_items/') || topic.startsWith('inventory_levels/')) {
    return ['products', 'product-filters'];
  }
  return ['products', 'collections', 'product-filters'];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const isValid = await verifyShopifyWebhook(req, body);

    if (!isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const topic = req.headers.get('x-shopify-topic') ?? 'unknown';
    const tags = tagsForTopic(topic);

    // Bust all relevant Next.js cache tags
    tags.forEach((tag) => revalidateTag(tag));

    console.log(`[revalidate] Shopify webhook "${topic}" → busted tags: ${tags.join(', ')}`);

    return NextResponse.json({ revalidated: true, tags, topic }, { status: 200 });
  } catch (err) {
    console.error('[revalidate] Error processing webhook:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Also allow GET with a secret token for manual revalidation (e.g. ?secret=xxx&tag=products)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');
  const tag = searchParams.get('tag');

  if (!WEBHOOK_SECRET || secret !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  const tagsToRevalidate = tag ? [tag] : ['products', 'collections', 'product-filters'];
  tagsToRevalidate.forEach((t) => revalidateTag(t));

  return NextResponse.json({ revalidated: true, tags: tagsToRevalidate });
}
