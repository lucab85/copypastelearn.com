import { describe, it, expect, vi } from "vitest";

const sessionsCreate = vi.fn(async (params: Record<string, unknown>) => {
  // Echo params back through `id`/`url` so the assertions can read them.
  return {
    id: "cs_test_123",
    url: "https://stripe/checkout/cs_test_123",
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    __params: params,
  };
});

vi.mock("stripe", () => {
  class Stripe {
    constructor(_key: string, _opts: unknown) {}
    checkout = { sessions: { create: sessionsCreate } };
    webhooks = { constructEvent: vi.fn() };
    refunds = { create: vi.fn() };
  }
  return { default: Stripe };
});

process.env.STRIPE_SECRET_KEY = "sk_test_dummy";

import { stripeCheckoutProvider } from "@/lib/payments/stripe-checkout";

describe("stripe-checkout createCheckout — Stripe Tax (T026a / FR-046)", () => {
  it("enables automatic_tax and required collection", async () => {
    sessionsCreate.mockClear();
    await stripeCheckoutProvider.createCheckout({
      cart: [
        {
          productId: "p1",
          quantity: 1,
          unitAmount: 2900,
          currency: "EUR",
          stripePriceId: "price_test_ebook",
          title: "Ebook",
        },
      ],
      customerEmail: "buyer@example.com",
      successUrl: "https://app/x",
      cancelUrl: "https://app/y",
    });
    const params = sessionsCreate.mock.calls[0]![0] as Record<string, unknown>;
    expect(params.automatic_tax).toEqual({ enabled: true });
    expect(params.tax_id_collection).toEqual({ enabled: true });
    expect(params.billing_address_collection).toBe("required");
    // payment_method_types is intentionally omitted so Stripe Dashboard config drives the set.
    expect(params.payment_method_types).toBeUndefined();
  });

  it("uses server-loaded stripe price IDs and never client unit amounts", async () => {
    sessionsCreate.mockClear();
    await stripeCheckoutProvider.createCheckout({
      cart: [
        {
          productId: "p1",
          quantity: 2,
          unitAmount: 2900,
          currency: "EUR",
          stripePriceId: "price_test_ebook",
          title: "Ebook",
        },
      ],
      successUrl: "https://app/x",
      cancelUrl: "https://app/y",
    });
    const params = sessionsCreate.mock.calls[0]![0] as Record<string, unknown>;
    const lineItems = params.line_items as Array<Record<string, unknown>>;
    expect(lineItems[0]).toEqual({ price: "price_test_ebook", quantity: 2 });
    // No `price_data`/`unit_amount` allowed at the line-item level.
    expect(lineItems[0].price_data).toBeUndefined();
    expect(lineItems[0].unit_amount).toBeUndefined();
  });
});
