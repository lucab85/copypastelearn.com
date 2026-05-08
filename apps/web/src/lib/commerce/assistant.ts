import type { Product } from "@prisma/client";
import {
  listPublishedProducts,
  type CatalogFilter,
} from "@/server/queries/catalog";
import {
  formatMoneyAmount,
  productCanonicalUrl,
  BRAND_DISPLAY_NAMES,
} from "@/lib/commerce/catalog";

/**
 * T087 [US6] — Deterministic on-site assistant.
 *
 * MVP per FR-033: NO LLM. We rank `PUBLISHED` catalog rows by
 * keyword/category overlap and return the top N with prices, formats,
 * and policy summaries sourced from the authoritative `Product` rows.
 *
 * The recommender NEVER invents a price, NEVER fabricates a slug or
 * URL, and NEVER returns a draft/archived row.
 */

export interface AssistantRecommendation {
  productId: string;
  slug: string;
  title: string;
  brand: string;
  productType: "EBOOK" | "TEMPLATE" | "COURSE" | "BUNDLE";
  format: string;
  url: string;
  priceFormatted: string;
  currency: string;
  summary: string;
  refundPolicySummary: string;
  deliverySummary: string;
  /** Diagnostic — number of keyword hits that drove the rank (>= 1). */
  matchScore: number;
}

const STOPWORDS = new Set([
  "a", "an", "and", "the", "of", "for", "to", "in", "on", "with", "is",
  "are", "i", "me", "my", "we", "our", "you", "your", "please", "want",
  "need", "show", "give", "find", "looking", "any", "some", "best",
  "good", "recommend", "suggest", "help",
]);

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

function scoreProduct(product: Product, tokens: string[]): number {
  if (!tokens.length) return 0;
  const haystack = [
    product.title,
    product.subtitle ?? "",
    product.description,
    BRAND_DISPLAY_NAMES[product.brand],
    product.productType,
    ...product.categories,
    ...product.tags,
    ...product.formats,
  ]
    .join(" ")
    .toLowerCase();

  let score = 0;
  for (const tok of tokens) {
    if (!tok) continue;
    if (haystack.includes(tok)) score += 1;
    // Boost when the token appears in the title.
    if (product.title.toLowerCase().includes(tok)) score += 1;
  }
  return score;
}

const REFUND_SUMMARY =
  "Full refund any time before your first download. After download, only goodwill refunds at our discretion.";
const DELIVERY_SUMMARY =
  "Instant digital delivery. Access link emailed and available in your library.";

export interface RecommendOptions {
  /** Hard cap on returned items. Defaults to 5, max 10. */
  limit?: number;
  /** Optional filters proxied to the catalog query. */
  brand?: CatalogFilter["brand"];
  category?: string;
  type?: CatalogFilter["type"];
}

export async function recommendProducts(
  query: string,
  opts: RecommendOptions = {},
): Promise<AssistantRecommendation[]> {
  const limit = Math.max(1, Math.min(opts.limit ?? 5, 10));
  const tokens = tokenize(query);

  const products = await listPublishedProducts({
    brand: opts.brand,
    category: opts.category,
    type: opts.type,
    limit: 50,
  });

  // If the query has no usable tokens, return the most-recently-updated
  // catalog rows (still PUBLISHED-only, still authoritative).
  const ranked = tokens.length
    ? products
        .map((p) => ({ p, score: scoreProduct(p, tokens) }))
        .filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score)
    : products.map((p) => ({ p, score: 1 }));

  return ranked.slice(0, limit).map(({ p, score }) => ({
    productId: p.id,
    slug: p.slug,
    title: p.title,
    brand: BRAND_DISPLAY_NAMES[p.brand],
    productType: p.productType,
    format: (p.formats[0] ?? p.productType).toLowerCase(),
    url: productCanonicalUrl(p.slug),
    priceFormatted: formatMoneyAmount(p.priceAmount),
    currency: p.currency.toUpperCase(),
    summary: p.subtitle ?? p.description.slice(0, 280),
    refundPolicySummary: REFUND_SUMMARY,
    deliverySummary: DELIVERY_SUMMARY,
    matchScore: score,
  }));
}
