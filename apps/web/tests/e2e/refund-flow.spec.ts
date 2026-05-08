import { test } from "@playwright/test";

/**
 * T068 [US4] — Refund flow end-to-end.
 *
 * Skipped pending Stripe + Clerk admin fixtures.
 *
 * Flow:
 *   1. Seed a PAID order with one ACTIVE pre-download entitlement
 *      (firstAccessedAt === null).
 *   2. Sign in as admin → /admin/orders/[id] → "Issue refund".
 *   3. Assert: Stripe `refunds.create` was called; entitlement is
 *      REFUNDED; download tokens are revoked; order is REFUNDED;
 *      refund email is sent (verify via Resend mock).
 *   4. Hit /api/download/<old-token> → expect 410 with
 *      `error.code === "token_expired_or_consumed"`.
 */
test.skip("admin issues refund on pre-download order → entitlement REFUNDED → token returns 410", async ({
  page,
}) => {
  await page.goto("/admin/orders");
});
