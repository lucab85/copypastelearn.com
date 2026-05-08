import { test } from "@playwright/test";

/**
 * T080 [US5] — Bundle purchase end-to-end.
 *
 * Skipped pending Stripe + Clerk fixtures.
 *
 * Flow:
 *   1. Visit /bundles/devops-copy-paste-bundle.
 *   2. Click "Buy bundle" → server creates Stripe session.
 *   3. Complete payment in Stripe test mode.
 *   4. Webhook expands the bundle → N entitlements created.
 *   5. Sign in → /library lists every included product.
 *   6. Visit any included product page → "Already owned" badge.
 */
test.skip("buyer purchases a bundle → all included products appear in library + on product pages", async ({
  page,
}) => {
  await page.goto("/bundles/devops-copy-paste-bundle");
});
