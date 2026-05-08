import { db } from "@/lib/db";

/** Library entitlement view — one row per ACTIVE entitlement for a Clerk user. */
export interface LibraryEntry {
  entitlementId: string;
  productId: string;
  productSlug: string;
  productTitle: string;
  productType: "EBOOK" | "TEMPLATE" | "COURSE" | "BUNDLE";
  brand: string;
  pinnedFileId: string | null;
  pinnedFileVersion: string | null;
  fileSizeBytes: number | null;
  grantedAt: Date;
  firstAccessedAt: Date | null;
  orderId: string;
}

/**
 * List ACTIVE entitlements for the signed-in Clerk user (FR-027 / US2).
 *
 * Resolution order:
 *  - `Customer.userId === clerkUserId`, OR
 *  - any `Customer.email` (case-insensitive) matching a verified
 *    Clerk email address from `clerkEmails` (lazy-link fallback).
 */
export async function listEntitlementsForUser(args: {
  clerkUserId: string;
  clerkEmails: string[];
}): Promise<LibraryEntry[]> {
  const emails = args.clerkEmails
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const rows = await db.entitlement.findMany({
    where: {
      status: "ACTIVE",
      customer: {
        OR: [
          { userId: args.clerkUserId },
          ...(emails.length
            ? emails.map((email) => ({
                email: { equals: email, mode: "insensitive" as const },
              }))
            : []),
        ],
      },
    },
    include: {
      product: true,
      pinnedFile: true,
    },
    orderBy: { grantedAt: "desc" },
  });

  return rows.map((r) => ({
    entitlementId: r.id,
    productId: r.productId,
    productSlug: r.product.slug,
    productTitle: r.product.title,
    productType: r.product.productType,
    brand: r.product.brand,
    pinnedFileId: r.pinnedFileId,
    pinnedFileVersion: r.pinnedFile?.version ?? null,
    fileSizeBytes: r.pinnedFile?.sizeBytes ?? null,
    grantedAt: r.grantedAt,
    firstAccessedAt: r.firstAccessedAt,
    orderId: r.orderId,
  }));
}
