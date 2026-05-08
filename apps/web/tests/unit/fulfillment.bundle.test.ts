import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * T079 [US5] — Bundle fulfillment expansion.
 *
 * Asserts that when a checkout session contains a bundle line, the
 * fulfillment loop creates one OrderItem (the bundle) plus N
 * Entitlements — one per included Product — each pinned to that
 * product's current ProductFile (FR-021 / A11).
 */

// ----- mocks -------------------------------------------------------

const webhookCreate = vi.fn();
const productFindFirst = vi.fn();
const bundleFindFirst = vi.fn();
const customerFindUnique = vi.fn();
const customerFindFirst = vi.fn();
const customerCreate = vi.fn();
const customerUpdate = vi.fn();
const orderCreate = vi.fn();
const orderItemCreate = vi.fn();
const bundleItemFindMany = vi.fn();
const productFileFindFirst = vi.fn();
const entitlementCreate = vi.fn();
const webhookUpdate = vi.fn();

const tx = {
  customer: {
    findUnique: customerFindUnique,
    findFirst: customerFindFirst,
    create: customerCreate,
    update: customerUpdate,
  },
  order: { create: orderCreate },
  orderItem: { create: orderItemCreate },
  bundleItem: { findMany: bundleItemFindMany },
  productFile: { findFirst: productFileFindFirst },
  entitlement: { create: entitlementCreate },
  webhookEventLog: { update: webhookUpdate },
};

vi.mock("@/lib/db", () => ({
  db: {
    webhookEventLog: { create: (a: unknown) => webhookCreate(a) },
    product: { findFirst: (a: unknown) => productFindFirst(a) },
    bundle: { findFirst: (a: unknown) => bundleFindFirst(a) },
    $transaction: async (fn: (t: typeof tx) => Promise<unknown>) => fn(tx),
  },
}));

const listLineItems = vi.fn();
vi.mock("@/lib/payments/stripe-checkout", () => ({
  getStripe: () => ({
    checkout: { sessions: { listLineItems } },
  }),
}));

vi.mock("@/lib/delivery/tokens", () => ({
  mintDownloadToken: vi.fn(async () => ({
    plaintextToken: "tok_xyz",
    expiresAt: new Date(),
  })),
}));
vi.mock("@/lib/fulfillment/email", () => ({
  sendOrderConfirmationEmail: vi.fn(async () => undefined),
}));
vi.mock("@/lib/commerce/analytics", () => ({
  recordCommerceEvent: vi.fn(async () => undefined),
}));
vi.mock("@/lib/commerce/catalog", () => ({
  formatMoneyAmount: (n: number) => (n / 100).toFixed(2),
}));
vi.mock("@/lib/logger", () => ({
  serverLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
  webhookCreate.mockResolvedValue({});
  customerFindUnique.mockResolvedValue(null);
  customerFindFirst.mockResolvedValue(null);
  customerCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
    id: "cust_1",
    ...data,
  }));
  customerUpdate.mockImplementation(async ({ data }) => ({ id: "cust_1", ...data }));
  orderCreate.mockResolvedValue({ id: "ord_1" });
  orderItemCreate.mockResolvedValue({});
  entitlementCreate.mockResolvedValue({ id: "ent_1" });
  webhookUpdate.mockResolvedValue({});
});

function makeEvent() {
  return {
    id: "evt_1",
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_1",
        customer_email: "buyer@example.com",
        customer_details: { email: "buyer@example.com", address: { country: "NL" } },
        amount_subtotal: 5900,
        amount_total: 5900,
        total_details: { amount_tax: 0 },
        currency: "eur",
        payment_intent: "pi_test_1",
        customer: "cus_test_1",
        metadata: { source_domain: "ansiblepilot.com" },
      },
    },
  } as unknown as import("stripe").Stripe.Event;
}

describe("fulfillCheckoutCompleted — bundle expansion (T079)", () => {
  it("creates one OrderItem for the bundle plus one Entitlement per included product, each pinned", async () => {
    listLineItems.mockResolvedValue({
      data: [{ price: { id: "price_bundle_1", unit_amount: 5900 }, quantity: 1 }],
    });
    productFindFirst.mockResolvedValue(null);
    bundleFindFirst.mockResolvedValue({ id: "bun_1" });
    bundleItemFindMany.mockResolvedValue([
      { bundleId: "bun_1", productId: "prod_a" },
      { bundleId: "bun_1", productId: "prod_b" },
      { bundleId: "bun_1", productId: "prod_c" },
    ]);
    productFileFindFirst.mockImplementation(async ({ where }: { where: { productId: string } }) => ({
      id: `file_${where.productId}`,
      productId: where.productId,
      version: "1.0",
    }));

    const { fulfillCheckoutCompleted } = await import("@/lib/fulfillment/fulfill");
    const out = await fulfillCheckoutCompleted(makeEvent());

    expect(out.outcome).toBe("fulfilled");
    expect(orderItemCreate).toHaveBeenCalledTimes(1);
    expect(orderItemCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ bundleId: "bun_1", productId: null }),
      }),
    );
    expect(entitlementCreate).toHaveBeenCalledTimes(3);
    const grantedProductIds = entitlementCreate.mock.calls.map(
      (c) => (c[0] as { data: { productId: string } }).data.productId,
    );
    expect(grantedProductIds.sort()).toEqual(["prod_a", "prod_b", "prod_c"]);
    // Each entitlement pinned to that product's current file (A11).
    for (const call of entitlementCreate.mock.calls) {
      const data = (call[0] as { data: { productId: string; pinnedFileId: string } }).data;
      expect(data.pinnedFileId).toBe(`file_${data.productId}`);
    }
  });

  it("dedupes when a bundle and one of its products are both purchased in the same session", async () => {
    listLineItems.mockResolvedValue({
      data: [
        { price: { id: "price_bundle_1", unit_amount: 5900 }, quantity: 1 },
        { price: { id: "price_prod_a", unit_amount: 2900 }, quantity: 1 },
      ],
    });
    productFindFirst.mockImplementation(async ({ where }: { where: { stripePriceId: string } }) =>
      where.stripePriceId === "price_prod_a" ? { id: "prod_a" } : null,
    );
    bundleFindFirst.mockImplementation(async ({ where }: { where: { stripePriceId: string } }) =>
      where.stripePriceId === "price_bundle_1" ? { id: "bun_1" } : null,
    );
    bundleItemFindMany.mockResolvedValue([
      { bundleId: "bun_1", productId: "prod_a" },
      { bundleId: "bun_1", productId: "prod_b" },
    ]);
    productFileFindFirst.mockImplementation(async ({ where }: { where: { productId: string } }) => ({
      id: `file_${where.productId}`,
    }));

    const { fulfillCheckoutCompleted } = await import("@/lib/fulfillment/fulfill");
    await fulfillCheckoutCompleted(makeEvent());

    // 2 OrderItems (bundle + product); 2 Entitlements (prod_a, prod_b — no duplicate).
    expect(orderItemCreate).toHaveBeenCalledTimes(2);
    expect(entitlementCreate).toHaveBeenCalledTimes(2);
    const ids = entitlementCreate.mock.calls.map(
      (c) => (c[0] as { data: { productId: string } }).data.productId,
    );
    expect(new Set(ids)).toEqual(new Set(["prod_a", "prod_b"]));
  });
});
