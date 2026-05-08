import { db } from "@/lib/db";

/** Load the current published version of a policy by slug (FR-047). */
export async function loadCurrentPolicy(slug: string): Promise<{
  slug: string;
  version: string;
  bodyMd: string;
  publishedAt: Date;
} | null> {
  const row = await db.policyDocument.findFirst({
    where: { slug, isCurrent: true },
    orderBy: { publishedAt: "desc" },
  });
  return row
    ? {
        slug: row.slug,
        version: row.version,
        bodyMd: row.bodyMd,
        publishedAt: row.publishedAt,
      }
    : null;
}

export const POLICY_SLUGS = {
  terms: "terms",
  privacy: "privacy",
  refund: "refund-policy",
  digitalDelivery: "digital-delivery-policy",
} as const;
