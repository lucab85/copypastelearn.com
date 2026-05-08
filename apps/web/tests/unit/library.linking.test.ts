import { describe, it, expect, beforeEach, vi } from "vitest";

// In-memory Customer store driving the mocked Prisma client.
type CustomerRow = {
  id: string;
  userId: string | null;
  email: string;
  createdAt: Date;
};

const store = {
  customers: [] as CustomerRow[],
};

vi.mock("@/lib/db", () => ({
  db: {
    customer: {
      findUnique: vi.fn(async ({ where }: { where: { userId?: string } }) => {
        if (where.userId == null) return null;
        return store.customers.find((c) => c.userId === where.userId) ?? null;
      }),
      findFirst: vi.fn(
        async ({
          where,
          orderBy,
        }: {
          where: { userId: null; email: { equals: string; mode: string } };
          orderBy?: unknown;
        }) => {
          void orderBy;
          const target = where.email.equals.toLowerCase();
          return (
            store.customers.find(
              (c) => c.userId === null && c.email.toLowerCase() === target,
            ) ?? null
          );
        },
      ),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: { userId: string };
        }) => {
          const idx = store.customers.findIndex((c) => c.id === where.id);
          if (idx < 0) throw new Error("customer not found");
          store.customers[idx] = { ...store.customers[idx], userId: data.userId };
          return store.customers[idx];
        },
      ),
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  serverLogger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  store.customers = [];
});

describe("linkClerkUserToCustomer (FR-029)", () => {
  it("links an unlinked Customer with a matching email", async () => {
    const { linkClerkUserToCustomer } = await import("@/lib/commerce/identity");
    store.customers.push({
      id: "cust_1",
      userId: null,
      email: "buyer@example.com",
      createdAt: new Date(),
    });

    const result = await linkClerkUserToCustomer({
      clerkUserId: "user_abc",
      email: "buyer@example.com",
    });

    expect(result?.id).toBe("cust_1");
    expect(result?.userId).toBe("user_abc");
    expect(store.customers[0].userId).toBe("user_abc");
  });

  it("matches email case-insensitively", async () => {
    const { linkClerkUserToCustomer } = await import("@/lib/commerce/identity");
    store.customers.push({
      id: "cust_2",
      userId: null,
      email: "Buyer@Example.com",
      createdAt: new Date(),
    });

    const result = await linkClerkUserToCustomer({
      clerkUserId: "user_def",
      email: "BUYER@example.COM",
    });

    expect(result?.userId).toBe("user_def");
  });

  it("returns the already-linked Customer without re-linking", async () => {
    const { linkClerkUserToCustomer } = await import("@/lib/commerce/identity");
    store.customers.push({
      id: "cust_3",
      userId: "user_ghi",
      email: "owner@example.com",
      createdAt: new Date(),
    });

    const result = await linkClerkUserToCustomer({
      clerkUserId: "user_ghi",
      email: "different@example.com",
    });

    expect(result?.id).toBe("cust_3");
    expect(result?.userId).toBe("user_ghi");
  });

  it("returns null when no Customer matches the Clerk email", async () => {
    const { linkClerkUserToCustomer } = await import("@/lib/commerce/identity");
    store.customers.push({
      id: "cust_4",
      userId: null,
      email: "someone-else@example.com",
      createdAt: new Date(),
    });

    const result = await linkClerkUserToCustomer({
      clerkUserId: "user_jkl",
      email: "no-match@example.com",
    });

    expect(result).toBeNull();
    expect(store.customers[0].userId).toBeNull();
  });

  it("does not link a Customer that is already linked to a different Clerk user", async () => {
    const { linkClerkUserToCustomer } = await import("@/lib/commerce/identity");
    store.customers.push({
      id: "cust_5",
      userId: "user_existing",
      email: "shared@example.com",
      createdAt: new Date(),
    });

    const result = await linkClerkUserToCustomer({
      clerkUserId: "user_new",
      email: "shared@example.com",
    });

    // findFirst filters userId: null, so the existing-linked row is invisible.
    expect(result).toBeNull();
    expect(store.customers[0].userId).toBe("user_existing");
  });
});
