import type Stripe from "stripe";
import { db } from "@/lib/db";
import { serverLogger } from "@/lib/logger";
import { stripeCheckoutProvider } from "./stripe-checkout";
import { fulfillCheckoutCompleted } from "@/lib/fulfillment/fulfill";
import { recordCommerceEvent } from "@/lib/commerce/analytics";

/**
 * Stripe webhook router. Verifies signature, then dispatches by
 * event type per the matrix in contracts/webhooks.md.
 *
 * All branches are idempotent: WebhookEventLog (UNIQUE on
 * provider+eventId) is the source of truth for "already processed".
 */
export async function handleStripeWebhook(
  rawBody: string,
  signature: string,
): Promise<{ received: true; outcome: string; orderId?: string }> {
  const event = stripeCheckoutProvider.verifyWebhook(rawBody, signature);

  switch (event.type) {
    case "checkout.session.completed": {
      const r = await fulfillCheckoutCompleted(event);
      return { received: true, outcome: r.outcome, orderId: r.orderId };
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      await markIdempotent(event);
      await recordCommerceEvent("checkout_abandoned", {
        metadata: { sessionId: session.id },
      });
      return { received: true, outcome: "checkout_abandoned" };
    }

    case "charge.refunded":
    case "refund.created":
    case "refund.updated": {
      // Refund processing is owned by the admin action that initiates
      // refunds; the webhook reconciles the Order/Refund row state.
      // We mark idempotent and update Refund/Order rows when present.
      await markIdempotent(event);
      const refund = (event.data.object as Stripe.Refund | Stripe.Charge);
      const refundId =
        "refunds" in refund && refund.refunds?.data?.[0]?.id
          ? refund.refunds.data[0].id
          : (refund as Stripe.Refund).id;
      if (refundId) {
        const local = await db.refund.findUnique({
          where: { stripeRefundId: refundId },
        });
        if (local && local.status !== "succeeded") {
          await db.refund.update({
            where: { id: local.id },
            data: { status: "succeeded" },
          });
          await recordCommerceEvent("refund_completed", {
            orderId: local.orderId,
          });
        }
      }
      return { received: true, outcome: "refund_acked" };
    }

    case "payment_intent.payment_failed": {
      await markIdempotent(event);
      return { received: true, outcome: "payment_failed_acked" };
    }

    default: {
      await markIdempotent(event);
      serverLogger.info({ type: event.type, id: event.id }, "webhook.unhandled");
      return { received: true, outcome: "unhandled" };
    }
  }
}

async function markIdempotent(event: Stripe.Event): Promise<void> {
  try {
    await db.webhookEventLog.create({
      data: {
        provider: "stripe",
        eventId: event.id,
        eventType: event.type,
        processedAt: new Date(),
      },
    });
  } catch (err) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: string }).code === "P2002"
    ) {
      serverLogger.info(
        { eventId: event.id, type: event.type },
        "webhook.duplicate.skipped",
      );
      return;
    }
    throw err;
  }
}
