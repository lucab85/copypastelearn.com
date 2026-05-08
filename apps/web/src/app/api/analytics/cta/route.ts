import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { recordCommerceEvent } from "@/lib/commerce/analytics";
import { rateLimit } from "@/lib/ratelimit";
import { db } from "@/lib/db";
import { serverLogger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() ?? "unknown";
}

const ALLOWED_TYPES = new Set(["cta_view", "cta_click"]);

/**
 * T065 — `/api/analytics/cta` (US3).
 *
 * Best-effort beacon endpoint for the ArticleCTA component (T062) and
 * the article-cta.js widget (T063). Maps `cta_view` → `article_cta_view`
 * and `cta_click` → `article_cta_click` in the canonical event union.
 *
 * Always returns 204 to avoid CORS preflight overhead from
 * `navigator.sendBeacon`. Rate-limited per IP.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const budget = await rateLimit("agent:ip", `cta:${clientIp(req)}`);
  if (!budget.success) return new NextResponse(null, { status: 204 });

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const type = String(payload.type ?? "");
  if (!ALLOWED_TYPES.has(type)) return new NextResponse(null, { status: 204 });

  const productSlug =
    typeof payload.productSlug === "string" ? payload.productSlug : undefined;
  const utmCampaign =
    typeof payload.utmCampaign === "string" ? payload.utmCampaign : undefined;
  const utmContent =
    typeof payload.articleId === "string" ? payload.articleId : undefined;
  const brand = typeof payload.brand === "string" ? payload.brand : undefined;

  let productId: string | undefined;
  if (productSlug) {
    try {
      const p = await db.product.findUnique({
        where: { slug: productSlug },
        select: { id: true },
      });
      productId = p?.id;
    } catch (err) {
      serverLogger.warn(
        { err: err instanceof Error ? err.message : String(err) },
        "cta.lookup.failed",
      );
    }
  }

  const eventName =
    type === "cta_view" ? "article_cta_view" : "article_cta_click";

  await recordCommerceEvent(eventName, {
    productId,
    sourceDomain: brand && brand !== "copypastelearn" ? `${brand}.com` : undefined,
    utmSource: brand && brand !== "copypastelearn" ? `${brand}.com` : undefined,
    utmMedium: "article-cta",
    utmCampaign,
    metadata: { productSlug, utmContent, brand },
  });

  return new NextResponse(null, { status: 204 });
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "content-type",
    },
  });
}
