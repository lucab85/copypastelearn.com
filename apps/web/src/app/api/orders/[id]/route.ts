import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

/**
 * GET /api/orders/[id]
 *
 * Buyer-scoped order status (US2 / SC-005). Allows the success page
 * and library to poll fulfillment without exposing internal data.
 *
 * Authorization model:
 *   - Authenticated Clerk user whose linked `Customer.userId` matches OR
 *     whose verified Clerk email matches the order's `Customer.email`.
 *   - The order id is treated as a sufficient capability for the buyer
 *     who came in via the Stripe redirect (still gated to the matching
 *     customer email/userId — never returns mismatched orders).
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await ctx.params;

  const { auth, currentUser } = await import("@clerk/nextjs/server");
  const { userId } = await auth();
  if (!userId) return err("unauthenticated", "Sign in required", 401);

  const order = await db.order.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { include: { product: true, bundle: true } },
      entitlements: true,
    },
  });
  if (!order) return err("not_found", "Order not found", 404);

  const clerkUser = await currentUser();
  const verifiedEmails = (clerkUser?.emailAddresses ?? [])
    .filter((e) => !e.verification || e.verification.status === "verified")
    .map((e) => e.emailAddress.toLowerCase());

  const ownsByUserId = order.customer.userId === userId;
  const ownsByEmail = verifiedEmails.includes(order.customer.email.toLowerCase());
  if (!ownsByUserId && !ownsByEmail) {
    return err("not_found", "Order not found", 404);
  }

  return NextResponse.json({
    id: order.id,
    status: order.status,
    currency: order.currency,
    subtotalAmount: order.subtotalAmount,
    taxAmount: order.taxAmount,
    totalAmount: order.totalAmount,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((it) => ({
      id: it.id,
      productId: it.productId,
      bundleId: it.bundleId,
      title: it.product?.title ?? it.bundle?.title ?? null,
      quantity: it.quantity,
      unitAmount: it.unitAmount,
      currency: it.currency,
    })),
    entitlements: order.entitlements.map((e) => ({
      id: e.id,
      productId: e.productId,
      status: e.status,
    })),
  });
}
