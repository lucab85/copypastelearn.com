import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  listPublishedProducts,
  type CatalogFilter,
} from "@/server/queries/catalog";
import {
  productCanonicalUrl,
  formatMoneyAmount,
} from "@/lib/commerce/catalog";
import { rateLimit } from "@/lib/ratelimit";
import type { Brand, ProductType } from "@prisma/client";

export const runtime = "nodejs";

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const limit = await rateLimit("feed:ip", clientIp(req));
  if (!limit.success) {
    return NextResponse.json(
      { error: { code: "rate_limited", message: "Too many requests" } },
      { status: 429 },
    );
  }

  const url = new URL(req.url);
  const filter: CatalogFilter = {
    brand: (url.searchParams.get("brand") ?? undefined) as Brand | undefined,
    type: (url.searchParams.get("type") ?? undefined) as
      | ProductType
      | undefined,
    category: url.searchParams.get("category") ?? undefined,
    limit: Math.min(Number(url.searchParams.get("limit") ?? 50), 100),
  };

  const products = await listPublishedProducts(filter);
  return NextResponse.json(products.map(serialize));
}

function serialize(p: Awaited<ReturnType<typeof listPublishedProducts>>[number]) {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    summary: p.subtitle,
    description: p.description,
    productType: p.productType,
    brand: p.brand,
    categories: p.categories,
    price: { amount: formatMoneyAmount(p.priceAmount), currency: p.currency },
    canonicalUrl: productCanonicalUrl(p.slug),
    coverImageUrl: p.imageUrl,
    status: p.status,
    updatedAt: p.updatedAt.toISOString(),
  };
}
