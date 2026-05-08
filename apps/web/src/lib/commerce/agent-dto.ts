import type { Product } from "@prisma/client";
import {
  formatMoneyAmount,
  productCanonicalUrl,
  BRAND_DISPLAY_NAMES,
} from "@/lib/commerce/catalog";

/**
 * Public-safe product projection for agent surfaces (FR-038 / FR-040).
 *
 * NEVER includes file URLs, S3 keys, or pinned-file IDs. NEVER includes
 * the buyer-side success/cancel URLs or admin notes.
 */
export interface AgentProductDto {
  id: string;
  slug: string;
  title: string;
  description: string;
  brand: string;
  type: "EBOOK" | "TEMPLATE" | "COURSE" | "BUNDLE";
  format: string;
  url: string;
  image_url?: string;
  category?: string;
  price: { amount: string; currency: string };
  availability: "in_stock" | "out_of_stock";
  seller: string;
  updated_at: string;
}

export function toAgentProductDto(p: Product): AgentProductDto {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description,
    brand: BRAND_DISPLAY_NAMES[p.brand],
    type: p.productType,
    format: (p.formats[0] ?? p.productType).toLowerCase(),
    url: productCanonicalUrl(p.slug),
    image_url: p.imageUrl ?? undefined,
    category: p.categories[0],
    price: {
      amount: formatMoneyAmount(p.priceAmount),
      currency: p.currency.toUpperCase(),
    },
    availability: p.status === "PUBLISHED" ? "in_stock" : "out_of_stock",
    seller: "CopyPasteLearn",
    updated_at: p.updatedAt.toISOString(),
  };
}
