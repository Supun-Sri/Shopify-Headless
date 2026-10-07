import type { Money } from './types';

/**
 * Format a Shopify Money object into a locale-aware currency string.
 */
export function formatPrice(money: Money): string {
  const amount = parseFloat(money.amount);
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Sanitize user input to prevent XSS attacks.
 * Strips HTML tags and encodes special characters.
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate email format using a standard regex.
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Merge class names, filtering out falsy values.
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Validate that a checkout URL belongs to Shopify domain.
 * Prevents open redirect attacks.
 */
export function isValidCheckoutUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:' &&
      (parsed.hostname.endsWith('.myshopify.com') ||
        parsed.hostname.endsWith('.shopify.com'))
    );
  } catch {
    return false;
  }
}

/**
 * Debounce a function call.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Flatten Shopify edge/node connection to a simple array.
 */
export function flattenConnection<T>(connection: { edges: { node: T }[] }): T[] {
  return connection.edges.map((edge) => edge.node);
}

/**
 * Truncate text to a given length with ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '…';
}

/**
 * Build a Storefront product search query for when a Shopify collection
 * has no assigned products. Matches product types / titles by handle stem
 * (e.g. "adhesive" → ADHESIVES, TILE ADHESIVES & GROUTS).
 */
export function buildCollectionFallbackQuery(handle: string): string {
  const normalized = handle
    .toLowerCase()
    .replace(/-/g, ' ')
    .replace(/\bsealent\b/g, 'sealant') // common store typo
    .trim();

  const stem = normalized.split(/\s+/)[0] || normalized;
  const typePrefix = stem.toUpperCase();

  // Prefix match on product_type covers plural forms (ADHESIVE* → ADHESIVES)
  // Title match covers related items when type names differ (e.g. bonding)
  return `product_type:${typePrefix}* OR title:${stem}*`;
}
