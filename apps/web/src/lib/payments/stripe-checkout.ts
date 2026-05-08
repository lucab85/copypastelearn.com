import Stripe from "stripe";
import {
  type CreateCheckoutInput,
  type CreateCheckoutOutput,
  type PaymentProvider,
  type RefundInput,
  type RefundOutput,
  registerProvider,
} from "./provider";

let cached: Stripe | undefined;

export function getStripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  cached = new Stripe(key, {
    // Pin the API version to keep webhook event shapes stable.
    apiVersion: "2024-06-20",
    typescript: true,
  });
  return cached;
}

export const stripeCheckoutProvider: PaymentProvider = {
  method: "stripe_checkout",

  async createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutOutput> {
    const stripe = getStripe();

    // Server-side price loading (FR-006): we map each cart line to its
    // catalog `stripePriceId`; we MUST NOT pass `unit_amount` from the
    // client. Stripe Tax and Stripe-Dashboard-configured payment methods
    // are auto-applied (per research §2 / FR-015).
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: input.cart.map((line) => ({
        price: line.stripePriceId,
        quantity: line.quantity,
      })),
      customer_email: input.customerEmail,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      automatic_tax: { enabled: true },
      tax_id_collection: { enabled: true },
      billing_address_collection: "required",
      payment_intent_data: {
        // Buyers have explicitly consented to digital delivery (FR-048).
        description: "CopyPasteLearn — digital download",
      },
      metadata: input.metadata,
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL");
    }

    return {
      kind: "redirect",
      checkoutUrl: session.url,
      checkoutSessionId: session.id,
      expiresAt: session.expires_at
        ? new Date(session.expires_at * 1000)
        : undefined,
    };
  },

  verifyWebhook(rawBody: string, signature: string): Stripe.Event {
    const stripe = getStripe();
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
    }
    return stripe.webhooks.constructEvent(rawBody, signature, secret);
  },

  async refund(input: RefundInput): Promise<RefundOutput> {
    const stripe = getStripe();
    const refund = await stripe.refunds.create({
      payment_intent: input.paymentIntentId,
      amount: input.amount,
      reason: undefined, // Stripe enum is restrictive; pass our reason via metadata
      metadata: input.reason ? { cpl_reason: input.reason } : undefined,
    });
    return {
      providerRefundId: refund.id,
      status:
        refund.status === "succeeded"
          ? "succeeded"
          : refund.status === "failed"
            ? "failed"
            : "pending",
    };
  },
};

// Self-register on import.
registerProvider(stripeCheckoutProvider);
