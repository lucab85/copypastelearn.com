import type { Brand, ContentStatus, Product, Bundle } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

/** Public catalog read queries (FR-001 / FR-007 / FR-036). */

export interface CatalogFilter {
  brand?: Brand;
  category?: string;
  type?: "EBOOK" | "TEMPLATE" | "COURSE" | "BUNDLE";
  status?: ContentStatus; // defaults to PUBLISHED
  limit?: number;
}

const listPublishedProductsCached = unstable_cache(
  async (key: string): Promise<Product[]> => {
    const { brand, type, category, status, limit } = JSON.parse(key) as {
      brand?: Brand;
      type?: CatalogFilter["type"];
      category?: string;
      status?: ContentStatus;
      limit?: number;
    };
    return db.product.findMany({
      where: {
        status: status ?? "PUBLISHED",
        ...(brand ? { brand } : {}),
        ...(type ? { productType: type as Product["productType"] } : {}),
        ...(category ? { categories: { has: category } } : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });
  },
  ["catalog-products-v1"],
  { revalidate: 300, tags: ["catalog", "products"] },
);

export async function listPublishedProducts(
  filter: CatalogFilter = {},
): Promise<Product[]> {
  return listPublishedProductsCached(
    JSON.stringify({
      brand: filter.brand,
      type: filter.type,
      category: filter.category,
      status: filter.status,
      limit: filter.limit,
    }),
  );
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return db.product.findUnique({ where: { slug } });
}

export async function getProductById(id: string): Promise<Product | null> {
  return db.product.findUnique({ where: { id } });
}

export const listPublishedBundles = unstable_cache(
  async (): Promise<Bundle[]> => {
    return db.bundle.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { updatedAt: "desc" },
    });
  },
  ["catalog-bundles-v1"],
  { revalidate: 300, tags: ["catalog", "bundles"] },
);

export async function getBundleBySlug(slug: string): Promise<Bundle | null> {
  return db.bundle.findUnique({ where: { slug } });
}
