/**
 * Product search helpers for the PLP (`/products?q=`).
 * Improves typo tolerance and match breadth without touching suggestion UI.
 */

/** Common construction-catalog typos / alternate spellings → preferred term */
const TYPO_MAP: Record<string, string> = {
  sealent: 'sealant',
  sealents: 'sealants',
  selant: 'sealant',
  selants: 'sealants',
  adhesiv: 'adhesive',
  adheisive: 'adhesive',
  adhessive: 'adhesive',
  adhesieve: 'adhesive',
  adeshive: 'adhesive',
  waterproffing: 'waterproofing',
  waterprooing: 'waterproofing',
  waterprooofing: 'waterproofing',
  waterprofing: 'waterproofing',
  groutting: 'grouting',
  groouting: 'grouting',
  sikaflek: 'sikaflex',
  sikaflexx: 'sikaflex',
  sikaflec: 'sikaflex',
  mapeii: 'mapei',
  fosrock: 'fosroc',
  fosrok: 'fosroc',
  latacreate: 'laticrete',
  latacrete: 'laticrete',
  latticrete: 'laticrete',
  concrate: 'concrete',
  concreet: 'concrete',
  plasteringg: 'plastering',
  anker: 'anchor',
  ankor: 'anchor',
  bondingg: 'bonding',
  bondng: 'bonding',
};

/** Domain vocabulary used for fuzzy token correction (Levenshtein) */
const DOMAIN_TERMS = [
  'adhesive',
  'adhesives',
  'sealant',
  'sealants',
  'waterproofing',
  'grout',
  'grouts',
  'grouting',
  'concrete',
  'plaster',
  'plastering',
  'coating',
  'coatings',
  'primer',
  'bonding',
  'anchor',
  'anchors',
  'hardware',
  'flooring',
  'sikaflex',
  'mapei',
  'fosroc',
  'laticrete',
  'drfixit',
  'sika',
  'weber',
  'corrotech',
  'conmix',
  'tile',
  'epoxy',
  'cement',
  'mortar',
  'membrane',
  'bitumen',
];

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const prev = new Array<number>(n + 1);
  const curr = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return prev[n];
}

function normalizeQuery(q: string): string {
  return q
    .trim()
    .toLowerCase()
    .replace(/[^\w\s.&+-]/g, ' ')
    .replace(/\s+/g, ' ');
}

function fuzzyCorrectToken(token: string, extraDict: string[] = []): string {
  if (token.length < 3) return token;

  const dict = [...DOMAIN_TERMS, ...extraDict.map((t) => t.toLowerCase())];
  const threshold = token.length <= 4 ? 1 : token.length <= 8 ? 2 : 3;

  let best = token;
  let bestDist = Infinity;

  for (const word of dict) {
    // Skip wildly different lengths
    if (Math.abs(word.length - token.length) > threshold) continue;
    const dist = levenshtein(token, word);
    if (dist > 0 && dist <= threshold && dist < bestDist) {
      bestDist = dist;
      best = word;
    }
  }
  return best;
}

/**
 * Correct common typos and fuzzy-match tokens against domain vocabulary.
 * `extraDict` can include live product types / vendors from Shopify.
 */
export function correctSearchQuery(raw: string, extraDict: string[] = []): string {
  const normalized = normalizeQuery(raw);
  if (!normalized) return '';

  return normalized
    .split(' ')
    .map((token) => {
      if (TYPO_MAP[token]) return TYPO_MAP[token];
      // try singular/plural map keys
      if (token.endsWith('s') && TYPO_MAP[token.slice(0, -1)]) {
        return TYPO_MAP[token.slice(0, -1)] + 's';
      }
      return fuzzyCorrectToken(token, extraDict);
    })
    .join(' ');
}

/**
 * Build a Storefront product search clause that matches title, type, vendor, tags.
 * Broader than `title:q*` alone so brand / category typos still hit results.
 */
export function buildProductSearchClause(query: string): string {
  const q = normalizeQuery(query);
  if (!q) return '';

  const tokens = q.split(' ').filter(Boolean);

  // Multi-word: each token must match something (AND of per-token OR groups)
  if (tokens.length > 1) {
    return tokens
      .map((token) => {
        const upper = token.toUpperCase();
        return `(title:${token}* OR product_type:${upper}* OR vendor:${token}* OR tag:${token}* OR ${token})`;
      })
      .join(' AND ');
  }

  const token = tokens[0];
  const upper = token.toUpperCase();
  // Single term: fielded ORs + bare term (Shopify ranks bare queries with stemming)
  return `(title:${token}* OR product_type:${upper}* OR vendor:${token}* OR tag:${token}* OR ${token})`;
}

/**
 * Looser clause used when the primary search returns no products.
 * Drops field restrictions and ORs individual tokens / a shortened prefix.
 */
export function buildLooseProductSearchClause(query: string): string {
  const q = normalizeQuery(query);
  if (!q) return '';

  const tokens = q.split(' ').filter(Boolean);
  const parts = new Set<string>();

  parts.add(q); // bare full query
  for (const token of tokens) {
    parts.add(token);
    if (token.length >= 4) {
      parts.add(`${token.slice(0, -1)}*`); // drop last char (common typo tail)
      parts.add(`title:${token.slice(0, Math.max(3, token.length - 1))}*`);
    }
  }

  return `(${[...parts].join(' OR ')})`;
}

export interface SearchQueryPlan {
  /** Corrected user query (for display / debugging) */
  corrected: string;
  /** Primary Shopify products query clause */
  primary: string;
  /** Fallback when primary returns empty */
  loose: string;
}

/**
 * Plan search queries from a raw `q` param.
 * Does not touch suggestion/autocomplete UI.
 */
export function planProductSearch(raw: string, extraDict: string[] = []): SearchQueryPlan | null {
  const corrected = correctSearchQuery(raw, extraDict);
  if (!corrected) return null;

  return {
    corrected,
    primary: buildProductSearchClause(corrected),
    loose: buildLooseProductSearchClause(corrected),
  };
}
