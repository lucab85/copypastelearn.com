import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * T078b [US4] — Admin server-action authorization.
 *
 * Each commerce admin server action MUST gate on `requireAdmin()`
 * (FR-031). This test invokes each action with a non-admin Clerk
 * session and asserts:
 *   - the call rejects with a ForbiddenError, and
 *   - no DB write happens (the mocks would have recorded it).
 *
 * Implementation strategy: mock `@/lib/auth` so `requireAdmin` throws
 * the same `ForbiddenError` it would in production for a non-admin,
 * and assert that downstream Stripe/db mocks are NEVER called.
 */

class ForbiddenError extends Error {
  readonly statusCode = 403;
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

const requireAdmin = vi.fn();
vi.mock("@/lib/auth", () => ({
  requireAdmin: () => requireAdmin(),
  ForbiddenError,
  UnauthorizedError: class UnauthorizedError extends Error {},
}));

const stripeProductsCreate = vi.fn();
const stripePricesCreate = vi.fn();
const stripeRefundsCreate = vi.fn();
vi.mock("@/lib/payments/stripe-checkout", () => ({
  getStripe: () => ({
    products: { create: stripeProductsCreate },
    prices: { create: stripePricesCreate },
    refunds: { create: stripeRefundsCreate },
  }),
}));

const dbWrites = {
  productCreate: vi.fn(),
  productUpdate: vi.fn(),
  productFileFindFirst: vi.fn(),
  productFileCreate: vi.fn(),
  productFileUpdateMany: vi.fn(),
  productFindUnique: vi.fn(),
  policyUpsert: vi.fn(),
  policyUpdateMany: vi.fn(),
  policyUpdate: vi.fn(),
  policyFindUnique: vi.fn(),
  policyFindMany: vi.fn(),
  refundFindUnique: vi.fn(),
  orderFindUnique: vi.fn(),
  entitlementUpdate: vi.fn(),
};

vi.mock("@/lib/db", () => ({
  db: {
    product: {
      create: (args: unknown) => dbWrites.productCreate(args),
      update: (args: unknown) => dbWrites.productUpdate(args),
      findUnique: (args: unknown) => dbWrites.productFindUnique(args),
    },
    productFile: {
      findFirst: (args: unknown) => dbWrites.productFileFindFirst(args),
      create: (args: unknown) => dbWrites.productFileCreate(args),
      updateMany: (args: unknown) => dbWrites.productFileUpdateMany(args),
    },
    policyDocument: {
      upsert: (args: unknown) => dbWrites.policyUpsert(args),
      updateMany: (args: unknown) => dbWrites.policyUpdateMany(args),
      update: (args: unknown) => dbWrites.policyUpdate(args),
      findUnique: (args: unknown) => dbWrites.policyFindUnique(args),
      findMany: (args: unknown) => dbWrites.policyFindMany(args),
    },
    order: {
      findUnique: (args: unknown) => dbWrites.orderFindUnique(args),
    },
    entitlement: {
      update: (args: unknown) => dbWrites.entitlementUpdate(args),
    },
    $transaction: vi.fn(async (fn: any) => fn({})),
  },
}));

vi.mock("@/lib/commerce/audit", () => ({
  logAdminAction: vi.fn(async () => undefined),
}));

vi.mock("@/lib/fulfillment/refund", () => ({
  processRefund: vi.fn(),
  RefundError: class extends Error {},
}));

vi.mock("@/lib/delivery/tokens", () => ({
  mintDownloadToken: vi.fn(),
}));

vi.mock("@/lib/fulfillment/email", () => ({
  sendDownloadLinkEmail: vi.fn(),
  sendRefundConfirmationEmail: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  serverLogger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class {},
  PutObjectCommand: class {},
}));

beforeEach(() => {
  requireAdmin.mockReset();
  requireAdmin.mockRejectedValue(new ForbiddenError("Admin access required"));
  for (const fn of Object.values(dbWrites)) (fn as any).mockReset?.();
  stripeProductsCreate.mockReset();
  stripePricesCreate.mockReset();
  stripeRefundsCreate.mockReset();
});

describe("admin server actions reject non-admin callers (T078b, FR-031)", () => {
  it("createProduct rejects + writes nothing", async () => {
    const { createProduct } = await import(
      "@/server/actions/admin/products"
    );
    await expect(createProduct({})).rejects.toBeInstanceOf(ForbiddenError);
    expect(stripeProductsCreate).not.toHaveBeenCalled();
    expect(stripePricesCreate).not.toHaveBeenCalled();
    expect(dbWrites.productCreate).not.toHaveBeenCalled();
  });

  it("setProductStatus rejects + writes nothing", async () => {
    const { setProductStatus } = await import(
      "@/server/actions/admin/products"
    );
    await expect(
      setProductStatus({ id: "p", status: "PUBLISHED" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(dbWrites.productUpdate).not.toHaveBeenCalled();
  });

  it("uploadProductFile rejects + writes nothing", async () => {
    const { uploadProductFile } = await import(
      "@/server/actions/admin/files"
    );
    await expect(
      uploadProductFile({
        productId: "p",
        version: "1.0",
        contentBase64: "AA==",
        contentType: "application/pdf",
        filename: "f.pdf",
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(dbWrites.productFileCreate).not.toHaveBeenCalled();
  });

  it("refundOrder returns falsy ok and does NOT call Stripe", async () => {
    const { refundOrder } = await import("@/server/actions/admin/orders");
    await expect(refundOrder({ orderId: "o" })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(stripeRefundsCreate).not.toHaveBeenCalled();
  });

  it("reissueAccess rejects + does NOT mint token", async () => {
    const { reissueAccess } = await import("@/server/actions/admin/orders");
    const tokens = await import("@/lib/delivery/tokens");
    await expect(
      reissueAccess({ entitlementId: "e" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(tokens.mintDownloadToken).not.toHaveBeenCalled();
  });

  it("upsertPolicyDraft rejects + does NOT write", async () => {
    const { upsertPolicyDraft } = await import(
      "@/server/actions/admin/policies"
    );
    await expect(
      upsertPolicyDraft({
        slug: "terms",
        version: "1",
        bodyMd: "x".repeat(20),
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(dbWrites.policyUpsert).not.toHaveBeenCalled();
  });

  it("publishPolicy rejects + does NOT write", async () => {
    const { publishPolicy } = await import("@/server/actions/admin/policies");
    await expect(
      publishPolicy({ slug: "terms", version: "1" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(dbWrites.policyUpdateMany).not.toHaveBeenCalled();
  });
});
