import { describe, it, expect, beforeEach, vi } from "vitest";

// ─── In-memory fake Prisma store ──────────────────────────────────

type OrderRow = {
  id: string;
  customerId: string;
  totalAmount: number;
  currency: string;
  stripePaymentIntentId: string | null;
  status: string;
};
type EntitlementRow = {
  id: string;
  orderId: string;
  customerId: string;
  productId: string;
  status: "ACTIVE" | "REVOKED" | "REFUNDED";
  firstAccessedAt: Date | null;
  revokedAt: Date | null;
  revocationReason: string | null;
};
type RefundRow = {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  reason: string | null;
  initiatedBy: string;
  stripeRefundId: string;
};
type TokenRow = {
  id: string;
  entitlementId: string;
  revokedAt: Date | null;
};

const store = {
  orders: [] as OrderRow[],
  entitlements: [] as EntitlementRow[],
  refunds: [] as RefundRow[],
  tokens: [] as TokenRow[],
  customers: [] as { id: string; email: string }[],
};

let nextId = 0;
const id = (p: string) => `${p}_${++nextId}`;

vi.mock("@/lib/db", () => ({
  db: {
    order: {
      findUnique: vi.fn(async ({ where, include }: any) => {
        const o = store.orders.find((x) => x.id === where.id);
        if (!o) return null;
        return {
          ...o,
          refunds: include?.refunds ? store.refunds.filter((r) => r.orderId === o.id) : [],
          entitlements: include?.entitlements
            ? store.entitlements.filter((e) => e.orderId === o.id)
            : [],
        };
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const idx = store.orders.findIndex((o) => o.id === where.id);
        store.orders[idx] = { ...store.orders[idx], ...data };
        return store.orders[idx];
      }),
    },
    entitlement: {
      update: vi.fn(async ({ where, data }: any) => {
        const idx = store.entitlements.findIndex((e) => e.id === where.id);
        store.entitlements[idx] = { ...store.entitlements[idx], ...data };
        return store.entitlements[idx];
      }),
    },
    refund: {
      create: vi.fn(async ({ data }: any) => {
        const row: RefundRow = { id: id("ref"), ...data };
        store.refunds.push(row);
        return row;
      }),
    },
    downloadToken: {
      updateMany: vi.fn(async ({ where, data }: any) => {
        let count = 0;
        for (const t of store.tokens) {
          if (
            t.entitlementId === where.entitlementId &&
            (where.revokedAt === null ? t.revokedAt === null : true)
          ) {
            Object.assign(t, data);
            count++;
          }
        }
        return { count };
      }),
    },
    customer: {
      findUnique: vi.fn(async ({ where }: any) =>
        store.customers.find((c) => c.id === where.id) ?? null,
      ),
    },
  },
}));

const stripeRefundCreate = vi.fn();
vi.mock("@/lib/payments/stripe-checkout", () => ({
  getStripe: () => ({ refunds: { create: stripeRefundCreate } }),
}));

vi.mock("@/lib/fulfillment/email", () => ({
  sendRefundConfirmationEmail: vi.fn(async () => undefined),
}));

vi.mock("@/lib/commerce/analytics", () => ({
  recordCommerceEvent: vi.fn(async () => undefined),
}));

vi.mock("@/lib/commerce/audit", () => ({
  logAdminAction: vi.fn(async () => undefined),
}));

vi.mock("@/lib/commerce/catalog", () => ({
  formatMoneyAmount: (n: number) => (n / 100).toFixed(2),
}));

vi.mock("@/lib/logger", () => ({
  serverLogger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

beforeEach(() => {
  store.orders = [];
  store.entitlements = [];
  store.refunds = [];
  store.tokens = [];
  store.customers = [{ id: "cust_1", email: "buyer@example.com" }];
  nextId = 0;
  stripeRefundCreate.mockReset();
  stripeRefundCreate.mockResolvedValue({ id: "re_test_1", status: "succeeded" });
});

function seedOrder({
  total = 2900,
  firstAccessedAt = null,
}: { total?: number; firstAccessedAt?: Date | null } = {}) {
  store.orders.push({
    id: "ord_1",
    customerId: "cust_1",
    totalAmount: total,
    currency: "EUR",
    stripePaymentIntentId: "pi_test_1",
    status: "PAID",
  });
  store.entitlements.push({
    id: "ent_1",
    orderId: "ord_1",
    customerId: "cust_1",
    productId: "prod_1",
    status: "ACTIVE",
    firstAccessedAt,
    revokedAt: null,
    revocationReason: null,
  });
  store.tokens.push({
    id: "tok_1",
    entitlementId: "ent_1",
    revokedAt: null,
  });
}

// ─── Tests ────────────────────────────────────────────────────────

describe("processRefund (T066, FR-023, FR-048)", () => {
  it("pre-download full refund → entitlement REFUNDED + tokens revoked", async () => {
    seedOrder({ firstAccessedAt: null });
    const { processRefund } = await import("@/lib/fulfillment/refund");

    const result = await processRefund({
      orderId: "ord_1",
      actorId: "admin_1",
      reason: "customer_request",
    });

    expect(result.ok).toBe(true);
    expect(result.amountMinor).toBe(2900);
    expect(stripeRefundCreate).toHaveBeenCalledWith(
      expect.objectContaining({ payment_intent: "pi_test_1", amount: 2900 }),
    );

    expect(store.orders[0].status).toBe("REFUNDED");
    expect(store.entitlements[0].status).toBe("REFUNDED");
    expect(store.entitlements[0].revokedAt).not.toBeNull();
    expect(store.tokens[0].revokedAt).not.toBeNull();
    expect(result.revokedEntitlementIds).toEqual(["ent_1"]);
  });

  it("post-download full refund → entitlement remains ACTIVE by default (FR-048)", async () => {
    seedOrder({ firstAccessedAt: new Date("2026-04-01") });
    const { processRefund } = await import("@/lib/fulfillment/refund");

    await processRefund({ orderId: "ord_1", actorId: "admin_1" });

    expect(store.orders[0].status).toBe("REFUNDED");
    expect(store.entitlements[0].status).toBe("ACTIVE");
    expect(store.tokens[0].revokedAt).toBeNull();
  });

  it("post-download refund with revokeAccess=true → entitlement REFUNDED + tokens revoked", async () => {
    seedOrder({ firstAccessedAt: new Date("2026-04-01") });
    const { processRefund } = await import("@/lib/fulfillment/refund");

    await processRefund({
      orderId: "ord_1",
      actorId: "admin_1",
      revokeAccess: true,
    });

    expect(store.entitlements[0].status).toBe("REFUNDED");
    expect(store.tokens[0].revokedAt).not.toBeNull();
  });

  it("partial refund → order PARTIALLY_REFUNDED, entitlement ACTIVE", async () => {
    seedOrder({ firstAccessedAt: null });
    const { processRefund } = await import("@/lib/fulfillment/refund");

    await processRefund({
      orderId: "ord_1",
      actorId: "admin_1",
      amountMinor: 1000,
    });

    expect(store.orders[0].status).toBe("PARTIALLY_REFUNDED");
    expect(store.entitlements[0].status).toBe("ACTIVE");
  });

  it("rejects refund larger than remaining balance", async () => {
    seedOrder({ total: 2900 });
    const { processRefund, RefundError } = await import(
      "@/lib/fulfillment/refund"
    );

    await expect(
      processRefund({
        orderId: "ord_1",
        actorId: "admin_1",
        amountMinor: 5000,
      }),
    ).rejects.toBeInstanceOf(RefundError);
  });

  it("rejects refund on already-fully-refunded order", async () => {
    seedOrder({ total: 2900 });
    store.refunds.push({
      id: "ref_existing",
      orderId: "ord_1",
      amount: 2900,
      currency: "EUR",
      status: "succeeded",
      reason: null,
      initiatedBy: "admin_1",
      stripeRefundId: "re_existing",
    });
    const { processRefund, RefundError } = await import(
      "@/lib/fulfillment/refund"
    );

    await expect(
      processRefund({ orderId: "ord_1", actorId: "admin_1" }),
    ).rejects.toBeInstanceOf(RefundError);
  });
});
