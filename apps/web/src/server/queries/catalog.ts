import type { Brand, ContentStatus, Product, Bundle } from "@prisma/client";
import { db } from "@/lib/db";

/** Public catalog read queries (FR-001 / FR-007 / FR-036). */

export interface CatalogFilter {
  brand?: Brand;
  category?: string;
  type?: "EBOOK" | "TEMPLATE" | "COURSE" | "BUNDLE";
  status?: ContentStatus; // defaults to PUBLISHED
  limit?: number;
}

export async function listPublishedProducts(
  filter: CatalogFilter = {},
): Promise<Product[]> {
  return db.product.findMany({
    where: {
      status: filter.status ?? "PUBLISHED",
      ...(filter.brand ? { brand: filter.brand } : {}),
      ...(filter.type ? { productType: filter.type as Product["productType"] } : {}),
      ...(filter.category
        ? { categories: { has: filter.category } }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: filter.limit,
  });
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return db.product.findUnique({ where: { slug } });
}

export async function getProductById(id: string): Promise<Product | null> {
  return db.product.findUnique({ where: { id } });
}

export async function listPublishedBundles(): Promise<Bundle[]> {
  return db.bundle.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getBundleBySlug(slug: string): Promise<Bundle | null> {
  return db.bundle.findUnique({ where: { slug } });
}
