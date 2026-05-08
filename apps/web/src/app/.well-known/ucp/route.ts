import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { commerceFlags } from "@/lib/flags";

export const runtime = "nodejs";
export const revalidate = 300;

function appUrl(req: NextRequest): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin
  ).replace(/\/$/, "");
}

/**
 * GET /.well-known/ucp (T106, US9 / FR-039).
 *
 * Conforms to `contracts/schemas/ucp-discovery.schema.json`. Short
 * cache so flag flips propagate within SC-015's 5-minute window.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const base = appUrl(req);
  const body = {
    merchant: {
      name: "CopyPasteLearn",
      store: base,
      website: base,
      country: process.env.COMMERCE_MERCHANT_COUNTRY ?? "NL",
      support_email:
        process.env.COMMERCE_SUPPORT_EMAIL ?? "support@copypastelearn.com",
      merchant_of_record: true,
    },
    capabilities: {
      product_discovery: `${base}/feeds/products.json`,
      checkout: `${base}/api/agent/checkout`,
      order_status: `${base}/api/agent/orders/{id}`,
      refund_request: `${base}/api/agent/refund-request`,
    },
    fulfillment: {
      type: "digital_download",
      delivery_time: "instant",
    },
    payments: {
      provider: "stripe",
      current_flow: "stripe_checkout",
      future_supported_flow: commerceFlags.enableStripeSpt
        ? "shared_payment_token"
        : "none",
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
