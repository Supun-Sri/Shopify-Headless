/**
 * Core Shopify Storefront API fetch wrapper.
 * Server-side only — never import this in client components.
 */

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN!;
const storefrontAccessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN!;
const apiVersion = process.env.SHOPIFY_API_VERSION || '2024-01';

const endpoint = `https://${domain}/api/${apiVersion}/graphql.json`;

interface ShopifyFetchOptions {
  query: string;
  variables?: Record<string, unknown>;
  cache?: RequestCache;
  tags?: string[];
}

interface ShopifyResponse<T> {
  data: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
    extensions?: { code: string };
  }>;
}

/**
 * Execute a GraphQL query against the Shopify Storefront API.
 * Includes timeout, error handling, and retry logic for rate limits.
 */
export async function shopifyFetch<T>({
  query,
  variables = {},
  cache = 'force-cache',
  tags,
}: ShopifyFetchOptions): Promise<T> {
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': storefrontAccessToken,
        },
        body: JSON.stringify({ query, variables }),
        cache,
        signal: controller.signal,
        ...(tags && { next: { tags } }),
      });

      clearTimeout(timeoutId);

      // Handle rate limiting with exponential backoff
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      if (!response.ok) {
        throw new Error(
          `Shopify API error: ${response.status} ${response.statusText}`
        );
      }

      const json: ShopifyResponse<T> = await response.json();

      if (json.errors) {
        const errorMessages = json.errors.map((e) => e.message).join(', ');
        throw new Error(`Shopify GraphQL errors: ${errorMessages}`);
      }

      return json.data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on abort or non-retryable errors
      if (lastError.name === 'AbortError') {
        throw new Error('Shopify API request timed out');
      }

      // Retry on network errors
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 500)
        );
      }
    }
  }

  throw lastError || new Error('Shopify API request failed after retries');
}
