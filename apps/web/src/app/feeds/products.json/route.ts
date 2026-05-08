import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { buildProductFeed } from "@/lib/commerce/feed";
import { rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const revalidate = 300;

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() ?? "unknown";
}

/**
 * GET /feeds/products.json — public product feed (T094 / FR-039 / FR-040).
 *
 * - Conforms to contracts/schemas/product-feed.schema.json (T091).
 * - Cache: `public, s-maxage=300, stale-while-revalidate=60`.
 * - Rate-limited per IP via the `feed:ip` bucket (30/min).
 * - Never includes a protected file URL (T118 contract test enforces).
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const budget = await rateLimit("feed:ip", clientIp(req));
  if (!budget.success) {
    return NextResponse.json(
      { error: { code: "rate_limited", message: "Too many requests" } },
      { status: 429 },
    );
  }

  const feed = await buildProductFeed();
  return new NextResponse(JSON.stringify(feed), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, s-maxage=300, stale-while-revalidate=60",
      "access-control-allow-origin": "*",
    },
  });
}
