import { test } from "@playwright/test";

/**
 * T051 [US2] — Download token expiry / regeneration.
 *
 * Skipped pending shared Stripe + Clerk fixtures. Shape preserved for
 * staging wire-up.
 *
 * Flow:
 *   1. Use a token until exhausted (3 downloads) OR fast-forward expiry.
 *   2. Hitting /api/download/<token> returns 410 with
 *      `error.code === "token_expired_or_consumed"` and `error.recover_url`
 *      pointing to /library (T059).
 *   3. Sign in, regenerate via /library, confirm the new token returns
 *      302 and the previously-live token is now revoked (returns 410).
 */
test.skip("expired/exhausted token returns 410; regenerate yields working token; old token invalidated", async ({
  request,
}) => {
  const res = await request.get("/api/download/exhausted-token-fixture");
  void res;
});
