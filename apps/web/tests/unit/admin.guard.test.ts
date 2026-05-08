import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * T078a [US4] — Admin guard.
 *
 * The `requireAdmin()` helper in `@/lib/auth` enforces FR-031 across
 * every commerce admin server action and admin layout (T077).
 * This test asserts:
 *   - non-admin Clerk users are rejected with `ForbiddenError`,
 *   - unauthenticated callers are rejected with `UnauthorizedError`,
 *   - admin users pass through.
 *
 * The Clerk + DB layers are mocked so the test runs without a server.
 */

const clerkAuth = vi.fn();
const clerkCurrentUser = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({
  auth: () => clerkAuth(),
  currentUser: () => clerkCurrentUser(),
}));

const dbUserFindUnique = vi.fn();
vi.mock("@/lib/db", () => ({
  db: { user: { findUnique: (args: unknown) => dbUserFindUnique(args) } },
}));

beforeEach(() => {
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY =
    "pk_test_dGVzdC1jbGVyay5kZXYk";
  clerkAuth.mockReset();
  clerkCurrentUser.mockReset();
  dbUserFindUnique.mockReset();
});

describe("requireAdmin (T077, FR-031)", () => {
  it("throws UnauthorizedError when no Clerk session", async () => {
    clerkAuth.mockResolvedValue({ userId: null });
    const { requireAdmin, UnauthorizedError } = await import("@/lib/auth");
    await expect(requireAdmin()).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("throws ForbiddenError for non-admin users", async () => {
    clerkAuth.mockResolvedValue({ userId: "user_member" });
    dbUserFindUnique.mockResolvedValue({
      id: "u1",
      clerkUserId: "user_member",
      role: "MEMBER",
      email: "member@example.com",
    });
    const { requireAdmin, ForbiddenError } = await import("@/lib/auth");
    await expect(requireAdmin()).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("returns the user record for admins", async () => {
    clerkAuth.mockResolvedValue({ userId: "user_admin" });
    dbUserFindUnique.mockResolvedValue({
      id: "u_admin",
      clerkUserId: "user_admin",
      role: "ADMIN",
      email: "admin@example.com",
    });
    const { requireAdmin } = await import("@/lib/auth");
    const u = await requireAdmin();
    expect(u.role).toBe("ADMIN");
  });

  it("rejects when Clerk is not configured", async () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_...";
    const { requireAdmin, UnauthorizedError } = await import("@/lib/auth");
    await expect(requireAdmin()).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
