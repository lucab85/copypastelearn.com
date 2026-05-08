import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getProductById } from "@/server/queries/catalog";
import {
  productCanonicalUrl,
  formatMoneyAmount,
} from "@/lib/commerce/catalog";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await ctx.params;
  const p = await getProductById(id);
  if (!p || p.status !== "PUBLISHED") {
    return NextResponse.json(
      { error: { code: "not_found", message: "Product not found" } },
      { status: 404 },
    );
  }

  return NextResponse.json({
    id: p.id,
    slug: p.slug,
    title: p.title,
    subtitle: p.subtitle,
    description: p.description,
    productType: p.productType,
    brand: p.brand,
    categories: p.categories,
    price: { amount: formatMoneyAmount(p.priceAmount), currency: p.currency },
    canonicalUrl: productCanonicalUrl(p.slug),
    imageUrl: p.imageUrl,
    status: p.status,
    updatedAt: p.updatedAt.toISOString(),
  });
}
