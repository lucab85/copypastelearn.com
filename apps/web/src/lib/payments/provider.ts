import type Stripe from "stripe";

/**
 * PaymentProvider abstraction (FR-042).
 *
 * Catalog/orders/fulfillment/library/admin MUST NOT depend on the
 * specific Stripe flow used. Swapping or adding payment flows (Stripe
 * Checkout vs. Stripe Payment Intent vs. Stripe Shared Payment Token)
 * happens by registering another implementation.
 */

export type PaymentMethodKind =
  | "stripe_checkout"
  | "stripe_payment_intent"
  | "stripe_shared_payment_token";

export interface CartLine {
  productId?: string;
  bundleId?: string;
  quantity: number;
  /** Unit amount in minor units (cents). Loaded server-side. */
  unitAmount: number;
  currency: string;
  stripePriceId: string;
  title: string;
}

export interface CreateCheckoutInput {
  cart: CartLine[];
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
  /** When provided, used by SPT flow */
  sharedPaymentToken?: string;
}

export type CreateCheckoutOutput =
  | {
      kind: "redirect";
      checkoutUrl: string;
      checkoutSessionId: string;
      expiresAt?: Date;
    }
  | {
      kind: "completed";
      orderId: string;
      amount: { amount: string; currency: string };
    };

export interface RefundInput {
  paymentIntentId?: string;
  checkoutSessionId?: string;
  amount?: number;
  reason?: string;
}

export interface RefundOutput {
  providerRefundId: string;
  status: "pending" | "succeeded" | "failed";
}

export interface PaymentProvider {
  readonly method: PaymentMethodKind;

  createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutOutput>;

  /** Verify webhook signature; return parsed event or throw. */
  verifyWebhook(rawBody: string, signature: string): Stripe.Event;

  refund(input: RefundInput): Promise<RefundOutput>;
}

const registry = new Map<PaymentMethodKind, PaymentProvider>();

export function registerProvider(provider: PaymentProvider): void {
  registry.set(provider.method, provider);
}

export function getProvider(method: PaymentMethodKind): PaymentProvider {
  const p = registry.get(method);
  if (!p) {
    throw new Error(
      `No PaymentProvider registered for method "${method}". ` +
        `Did you forget to import its module?`,
    );
  }
  return p;
}

export function listProviders(): PaymentMethodKind[] {
  return Array.from(registry.keys());
}

/** For tests only — clear the registry. */
export function __resetProviderRegistryForTests(): void {
  registry.clear();
}
