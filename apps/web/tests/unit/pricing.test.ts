import { describe, it, expect, vi, beforeEach } from "vitest";

const findUniqueProduct = vi.fn();
const findUniqueBundle = vi.fn();
vi.mock("@/lib/db", () => ({
  db: {
    product: { findUnique: findUniqueProduct },
    bundle: { findUnique: findUniqueBundle },
  },
}));

import { resolveCartLines, PriceResolutionError } from "@/lib/commerce/pricing";

beforeEach(() => {
  findUniqueProduct.mockReset();
  findUniqueBundle.mockReset();
});

describe("resolveCartLines (T029 / FR-006)", () => {
  it("loads price/currency strictly from the catalog row, ignoring caller amounts", async () => {
    findUniqueProduct.mockResolvedValueOnce({
      id: "p1",
      status: "PUBLISHED",
      stripePriceId: "price_test",
      priceAmount: 2900,
      currency: "EUR",
      title: "Ebook",
    });
    // Note: input has NO unitAmount field — and the resolver MUST NOT
    // accept one. We assert the returned line uses the catalog values.
    const lines = await resolveCartLines([
      { productId: "p1", quantity: 1 },
    ]);
    expect(lines).toEqual([
      {
        productId: "p1",
        quantity: 1,
        unitAmount: 2900,
        currency: "EUR",
        stripePriceId: "price_test",
        title: "Ebook",
      },
    ]);
  });

  it("rejects unpublished products", async () => {
    findUniqueProduct.mockResolvedValueOnce({
      id: "p2",
      status: "DRAFT",
      stripePriceId: "price_x",
      priceAmount: 100,
      currency: "EUR",
      title: "draft",
    });
    await expect(resolveCartLines([{ productId: "p2", quantity: 1 }])).rejects.toBeInstanceOf(
      PriceResolutionError,
    );
  });

  it("rejects cart with missing identifiers", async () => {
    await expect(resolveCartLines([{ quantity: 1 }])).rejects.toThrow(
      /productId or bundleId/,
    );
  });

  it("rejects mixed-currency carts", async () => {
    findUniqueProduct.mockResolvedValueOnce({
      id: "a",
      status: "PUBLISHED",
      stripePriceId: "px",
      priceAmount: 100,
      currency: "EUR",
      title: "A",
    });
    findUniqueBundle.mockResolvedValueOnce({
      id: "b",
      status: "PUBLISHED",
      stripePriceId: "py",
      priceAmount: 100,
      currency: "USD",
      title: "B",
    });
    await expect(
      resolveCartLines([
        { productId: "a", quantity: 1 },
        { bundleId: "b", quantity: 1 },
      ]),
    ).rejects.toThrow(/mix currencies/);
  });

  it("rejects empty carts", async () => {
    await expect(resolveCartLines([])).rejects.toThrow(/empty/);
  });
});
