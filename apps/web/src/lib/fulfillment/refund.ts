import { db } from "@/lib/db";
import { getStripe } from "@/lib/payments/stripe-checkout";
import { sendRefundConfirmationEmail } from "@/lib/fulfillment/email";
import { recordCommerceEvent } from "@/lib/commerce/analytics";
import { logAdminAction } from "@/lib/commerce/audit";
import { serverLogger } from "@/lib/logger";
import { formatMoneyAmount } from "@/lib/commerce/catalog";

/**
 * T069 [US4] — `processRefund` (FR-023, FR-048).
 *
 * Pre-download (Entitlement.firstAccessedAt is null) → entitlement
 * transitions to REFUNDED and all live tokens are revoked.
 *
 * Post-download (firstAccessedAt set) → entitlement remains ACTIVE
 * unless the admin opts in to `revokeAccess`.
 *
 * Always:
 *  - calls Stripe `refunds.create` (full or partial),
 *  - persists a `Refund` row,
 *  - transitions Order.status → REFUNDED (full) or PARTIALLY_REFUNDED (partial),
 *  - sends the buyer a refund confirmation email,
 *  - emits `refund_requested` on intake and `refund_completed` on Stripe success,
 *  - audit-logs the action under the issuing admin.
 */

export interface ProcessRefundInput {
  /** Order id (cuid). */
  orderId: string;
  /** Admin actor id (db `User.id`) — used for audit logging. */
  actorId: string;
  /** Amount in MINOR units. Defaults to remaining un-refunded balance. */
  amountMinor?: number;
  /** Free-text reason. Stored on the Refund row + audit. */
  reason?: string;
  /**
   * Force-revoke entitlements/tokens on a post-download refund.
   * Default: post-download → keep access (per FR-048).
   */
  revokeAccess?: boolean;
}

export interface ProcessRefundResult {
  ok: true;
  refundId: string;
  stripeRefundId: string;
  amountMinor: number;
  status: string;
  revokedEntitlementIds: string[];
}

export class RefundError extends Error {
  constructor(
    public code:
      | "order_not_found"
      | "no_payment_intent"
      | "amount_invalid"
      | "already_fully_refunded",
    message: string,
  ) {
    super(message);
    this.name = "RefundError";
  }
}

export async function processRefund(
  input: ProcessRefundInput,
): Promise<ProcessRefundResult> {
  const order = await db.order.findUnique({
    where: { id: input.orderId },
    include: { refunds: true, entitlements: true },
  });
  if (!order) throw new RefundError("order_not_found", "Order not found");
  if (!order.stripePaymentIntentId) {
    throw new RefundError(
      "no_payment_intent",
      "Order has no Stripe payment intent — cannot refund",
    );
  }

  const alreadyRefunded = order.refunds
    .filter((r) => r.status !== "failed" && r.status !== "canceled")
    .reduce((sum, r) => sum + r.amount, 0);
  const remaining = order.totalAmount - alreadyRefunded;
  if (remaining <= 0) {
    throw new RefundError(
      "already_fully_refunded",
      "This order has already been fully refunded",
    );
  }

  const amount = input.amountMinor ?? remaining;
  if (amount <= 0 || amount > remaining) {
    throw new RefundError(
      "amount_invalid",
      `Refund amount must be between 1 and ${remaining}`,
    );
  }

  await recordCommerceEvent("refund_requested", {
    orderId: order.id,
    customerId: order.customerId,
    metadata: { amount, reason: input.reason ?? null },
  });

  // Call Stripe.
  const stripe = getStripe();
  const stripeRefund = await stripe.refunds.create({
    payment_intent: order.stripePaymentIntentId,
    amount,
    metadata: input.reason ? { cpl_reason: input.reason } : undefined,
  });

  const refundRow = await db.refund.create({
    data: {
      orderId: order.id,
      amount,
      currency: order.currency,
      reason: input.reason,
      initiatedBy: input.actorId,
      stripeRefundId: stripeRefund.id,
      status: stripeRefund.status ?? "pending",
    },
  });

  // Decide which entitlements to revoke.
  const newAlreadyRefunded = alreadyRefunded + amount;
  const isFullRefund = newAlreadyRefunded >= order.totalAmount;
  const revokedEntitlementIds: string[] = [];

  for (const ent of order.entitlements) {
    if (ent.status !== "ACTIVE") continue;
    const everAccessed = ent.firstAccessedAt !== null;
    const shouldRevoke =
      isFullRefund && (!everAccessed || input.revokeAccess === true);
    if (!shouldRevoke) continue;

    await db.entitlement.update({
      where: { id: ent.id },
      data: {
        status: "REFUNDED",
        revokedAt: new Date(),
        revocationReason: input.reason ?? "refund",
      },
    });
    await db.downloadToken.updateMany({
      where: { entitlementId: ent.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    revokedEntitlementIds.push(ent.id);
  }

  // Transition order status.
  await db.order.update({
    where: { id: order.id },
    data: {
      status: isFullRefund ? "REFUNDED" : "PARTIALLY_REFUNDED",
    },
  });

  // Send buyer email (best-effort).
  try {
    const customer = await db.customer.findUnique({
      where: { id: order.customerId },
    });
    if (customer?.email) {
      await sendRefundConfirmationEmail({
        to: customer.email,
        orderId: order.id,
        amount: formatMoneyAmount(amount),
        currency: order.currency,
        reason: input.reason,
        appUrl:
          process.env.NEXT_PUBLIC_APP_URL ?? "https://copypastelearn.com",
      });
    }
  } catch (err) {
    serverLogger.warn(
      { err: err instanceof Error ? err.message : String(err) },
      "refund.email_failed",
    );
  }

  // Audit log.
  await logAdminAction({
    actorId: input.actorId,
    action: isFullRefund ? "order.refund.full" : "order.refund.partial",
    targetType: "Order",
    targetId: order.id,
    payload: {
      amount,
      reason: input.reason ?? null,
      revokedEntitlementIds,
      stripeRefundId: stripeRefund.id,
    },
  });

  // Emit refund_completed only when Stripe says the refund succeeded
  // synchronously; otherwise the webhook (charge.refunded) will emit it.
  if (stripeRefund.status === "succeeded") {
    await recordCommerceEvent("refund_completed", {
      orderId: order.id,
      customerId: order.customerId,
      metadata: { amount, stripeRefundId: stripeRefund.id },
    });
  }

  return {
    ok: true,
    refundId: refundRow.id,
    stripeRefundId: stripeRefund.id,
    amountMinor: amount,
    status: refundRow.status,
    revokedEntitlementIds,
  };
}
