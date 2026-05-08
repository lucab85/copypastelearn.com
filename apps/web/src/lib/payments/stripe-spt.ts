import { commerceFlags } from "@/lib/flags";
import {
  type CreateCheckoutInput,
  type CreateCheckoutOutput,
  type PaymentProvider,
  type RefundInput,
  type RefundOutput,
  registerProvider,
} from "./provider";

/**
 * Stripe Shared Payment Token (SPT) provider — STUB at MVP.
 *
 * Per FR-043 / A9, SPT MUST remain disabled until the post-MVP
 * enablement decision. This stub rejects all calls while
 * `ENABLE_STRIPE_SPT=false`.
 *
 * Full FR-044 validation (token authenticity, scope, currency,
 * amount, expiry, cart-stability) is intentionally deferred and
 * will be authored as a follow-up task at enablement time.
 */

export class UnsupportedPaymentMethodError extends Error {
  readonly code = "unsupported_payment_method";
  constructor(message = "Stripe Shared Payment Tokens are disabled at MVP") {
    super(message);
    this.name = "UnsupportedPaymentMethodError";
  }
}

export const stripeSptProvider: PaymentProvider = {
  method: "stripe_shared_payment_token",

  async createCheckout(_input: CreateCheckoutInput): Promise<CreateCheckoutOutput> {
    if (!commerceFlags.enableStripeSpt) {
      throw new UnsupportedPaymentMethodError();
    }
    throw new Error(
      "Stripe SPT createCheckout not implemented (FR-044 deferred until SPT enablement)",
    );
  },

  verifyWebhook(): never {
    throw new UnsupportedPaymentMethodError();
  },

  async refund(_input: RefundInput): Promise<RefundOutput> {
    throw new UnsupportedPaymentMethodError();
  },
};

registerProvider(stripeSptProvider);
