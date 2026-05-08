import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimit } from "@/lib/ratelimit";
import { getProductById } from "@/server/queries/catalog";
import { toAgentProductDto } from "@/lib/commerce/agent-dto";

export const runtime = "nodejs";
export const revalidate = 60;

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() ?? "unknown";
}

/** GET /api/agent/products/[id] (T101a, US8). */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const budget = await rateLimit("agent:ip", clientIp(req));
  if (!budget.success) {
    return NextResponse.json(
      { error: { code: "rate_limited", message: "Too many requests" } },
      { status: 429 },
    );
  }

  const { id } = await params;
  const product = await getProductById(id);
  if (!product || product.status !== "PUBLISHED") {
    return NextResponse.json(
      { error: { code: "not_found", message: "Product not found" } },
      { status: 404 },
    );
  }
  return NextResponse.json(toAgentProductDto(product));
}
