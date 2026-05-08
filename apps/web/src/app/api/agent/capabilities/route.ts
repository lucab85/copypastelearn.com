import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimit } from "@/lib/ratelimit";
import { commerceFlags } from "@/lib/flags";

export const runtime = "nodejs";
export const revalidate = 300;

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() ?? "unknown";
}

function appUrl(req: NextRequest): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin
  ).replace(/\/$/, "");
}

/**
 * GET /api/agent/capabilities (T100, US8 / FR-037 / FR-043).
 *
 * Conforms to `contracts/schemas/agent-capabilities.schema.json`.
 * SPT support reflects `commerceFlags.enableStripeSpt` so flipping
 * the env var propagates within the cache window (SC-015).
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const budget = await rateLimit("agent:ip", clientIp(req));
  if (!budget.success) {
    return NextResponse.json(
      { error: { code: "rate_limited", message: "Too many requests" } },
      { status: 429 },
    );
  }

  const base = appUrl(req);
  const body = {
    merchant: {
      name: "CopyPasteLearn",
      store: base,
      country: process.env.COMMERCE_MERCHANT_COUNTRY ?? "NL",
      merchant_of_record: true,
      support_email:
        process.env.COMMERCE_SUPPORT_EMAIL ?? "support@copypastelearn.com",
      website: base,
    },
    checkout: {
      stripe_checkout: true,
      stripe_payment_intent: false,
      stripe_shared_payment_token: commerceFlags.enableStripeSpt,
    },
    fulfillment: {
      digital_download: true,
      instant_delivery: true,
    },
    currencies: ["EUR"],
    support: {
      order_status: true,
      refund_request: true,
    },
    endpoints: {
      products: `${base}/api/agent/products`,
      checkout: `${base}/api/agent/checkout`,
      order_status: `${base}/api/agent/orders/{id}`,
      refund_request: `${base}/api/agent/refund-request`,
    },
  };

  return new NextResponse(JSON.stringify(body), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, s-maxage=300, stale-while-revalidate=60",
      "access-control-allow-origin": "*",
    },
  });
}
