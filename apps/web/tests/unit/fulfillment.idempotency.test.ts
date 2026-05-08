import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * T030 / SC-003: invoking `fulfillCheckoutCompleted` twice with the
 * same Stripe event id MUST create exactly one Order, one Entitlement,
 * one DownloadToken, and one EmailJob.
 */

interface Counters {
  customerCreate: number;
  customerFindFirst: number;
  customerUpsert: number;
  orderCreate: number;
  orderItemCreate: number;
  entitlementCreate: number;
  productFileFindFirst: number;
  webhookCreate: number;
  webhookUpdate: number;
  emailCreate: number;
}
const c: Counters = {
  customerCreate: 0,
  customerFindFirst: 0,
  customerUpsert: 0,
  orderCreate: 0,
  orderItemCreate: 0,
  entitlementCreate: 0,
  productFileFindFirst: 0,
  webhookCreate: 0,
  webhookUpdate: 0,
  emailCreate: 0,
};

let webhookSeen = new Set<string>();

function unique(err: string) {
  const e = new Error(err) as Error & { code: string };
  e.code = "P2002";
  return e;
}

const tx = {
  customer: {
    findUnique: vi.fn(async () => null),
    findFirst: vi.fn(async () => {
      c.customerFindFirst++;
      return null;
    }),
    create: vi.fn(async (args: { data: { email: string } }) => {
      c.customerCreate++;
      return { id: "cust_1", email: args.data.email, country: "DE", stripeCustomerId: null };
    }),
    update: vi.fn(async () => ({ id: "cust_1" })),
  },
  order: {
    create: vi.fn(async () => {
      c.orderCreate++;
      return { id: "order_1" };
    }),
  },
  orderItem: {
    create: vi.fn(async () => {
      c.orderItemCreate++;
      return {};
    }),
  },
  bundleItem: { findMany: vi.fn(async () => []) },
  entitlement: {
    create: vi.fn(async () => {
      c.entitlementCreate++;
      return { id: "ent_1" };
    }),
  },
  productFile: {
    findFirst: vi.fn(async () => {
      c.productFileFindFirst++;
      return { id: "file_1" };
    }),
  },
  webhookEventLog: {
    update: vi.fn(async () => {
      c.webhookUpdate++;
      return {};
    }),
  },
};

const db = {
  webhookEventLog: {
    create: vi.fn(async (args: { data: { eventId: string } }) => {
      if (webhookSeen.has(args.data.eventId)) throw unique("duplicate");
      webhookSeen.add(args.data.eventId);
      c.webhookCreate++;
      return {};
    }),
  },
  $transaction: vi.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)),
  entitlement: {
    findMany: vi.fn(async () => [
      { id: "ent_1", customerId: "cust_1", productId: "prod_1", product: { title: "Ebook" } },
    ]),
    update: vi.fn(),
  },
  product: { findFirst: vi.fn(async () => ({ id: "prod_1", slug: "ebook" })) },
  bundle: { findFirst: vi.fn(async () => null) },
  emailJob: {
    create: vi.fn(async () => {
      c.emailCreate++;
      return { id: "email_1" };
    }),
    update: vi.fn(async () => ({})),
  },
  downloadToken: {
    create: vi.fn(async () => ({
      id: "tok_1",
      tokenHash: "h",
      expiresAt: new Date(Date.now() + 86_400_000),
    })),
  },
};

vi.mock("@/lib/db", () => ({ db }));

// Stripe is reached via a dynamic import inside fulfill.ts.
const listLineItems = vi.fn(async () => ({
  data: [{ price: { id: "price_test" }, quantity: 1 }],
}));
vi.mock("@/lib/payments/stripe-checkout", () => ({
  getStripe: () => ({ checkout: { sessions: { listLineItems } } }),
  // not used in this path but keeps the import shape stable
  stripeCheckoutProvider: {},
}));

import { fulfillCheckoutCompleted } from "@/lib/fulfillment/fulfill";

beforeEach(() => {
  webhookSeen = new Set();
  for (const k of Object.keys(c) as Array<keyof Counters>) c[k] = 0;
});

describe("fulfillCheckoutCompleted idempotency (T030 / SC-003)", () => {
  const event = {
    id: "evt_test_1",
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_1",
        mode: "payment",
        amount_subtotal: 2900,
        amount_total: 3500,
        total_details: { amount_tax: 600 },
        currency: "eur",
        customer: null,
        customer_email: "buyer@example.com",
        customer_details: {
          email: "buyer@example.com",
          address: { country: "DE" },
        },
        payment_intent: "pi_test_1",
        metadata: {},
      },
    },
  } as never;

  it("creates exactly one of each row even when invoked twice", async () => {
    const r1 = await fulfillCheckoutCompleted(event);
    const r2 = await fulfillCheckoutCompleted(event);
    expect(r1.outcome).toBe("fulfilled");
    expect(r2.outcome).toBe("duplicate");

    expect(c.webhookCreate).toBe(1);
    expect(c.orderCreate).toBe(1);
    expect(c.orderItemCreate).toBe(1);
    expect(c.entitlementCreate).toBe(1);
    expect(c.customerCreate).toBe(1);
    expect(c.emailCreate).toBe(1);
  });
});
