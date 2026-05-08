import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimit } from "@/lib/ratelimit";
import { db } from "@/lib/db";
import { formatMoneyAmount } from "@/lib/commerce/catalog";

export const runtime = "nodejs";

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() ?? "unknown";
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const head = local.slice(0, 1);
  return `${head}***@${domain}`;
}

/**
 * GET /api/agent/orders/[id] (T103, US8 / FR-038).
 *
 * Returns minimal order/delivery state. NEVER returns Stripe payment
 * intent ids, payment-method credentials, full buyer email, billing
 * address, or protected file URLs.
 */
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
  const order = await db.order.findUnique({
    where: { id },
    include: {
      customer: { select: { email: true } },
      entitlements: { select: { id: true, status: true } },
    },
  });
  if (!order) {
    return NextResponse.json(
      { error: { code: "not_found", message: "Order not found" } },
      { status: 404 },
    );
  }

  const allActive =
    order.entitlements.length > 0 &&
    order.entitlements.every((e) => e.status === "ACTIVE");
  const deliveryState =
    order.status === "PAID" && allActive
      ? "delivered"
      : order.status === "PAID"
        ? "pending"
        : order.status === "REFUNDED" || order.status === "PARTIALLY_REFUNDED"
          ? "refunded"
          : "pending";

  return NextResponse.json({
    order_id: order.id,
    status: order.status,
    delivery_state: deliveryState,
    amount: {
      amount: formatMoneyAmount(order.totalAmount),
      currency: order.currency.toUpperCase(),
    },
    customer_email_masked: maskEmail(order.customer.email),
    created_at: order.createdAt.toISOString(),
  });
}
