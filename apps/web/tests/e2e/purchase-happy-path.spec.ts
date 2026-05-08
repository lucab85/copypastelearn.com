/**
 * Purchase happy path (T032 / SC-001).
 *
 * REQUIREMENTS to run:
 *   - PLAYWRIGHT_BASE_URL pointing at a running app (default http://localhost:3000)
 *   - Stripe test mode keys configured
 *   - At least one PUBLISHED product seeded with slug `ansible-automation-playbook`
 *
 * This is intentionally not enabled in CI by default — wire it into a
 * staging job once Stripe webhooks are forwarded (e.g. via `stripe listen`).
 */
import { test, expect } from "@playwright/test";

const SLUG = process.env.E2E_PRODUCT_SLUG ?? "ansible-automation-playbook";

test("buyer completes Stripe Checkout and reaches success page", async ({ page }) => {
  await page.goto(`/products/${SLUG}`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  // Click the storefront Buy button. The component POSTs to
  // /api/checkout/stripe and follows the redirect.
  await Promise.all([
    page.waitForURL(/checkout\.stripe\.com|stripe/),
    page.getByRole("button", { name: /buy now/i }).first().click(),
  ]);

  // Stripe Checkout — fill the test card.
  // Stripe iframes change frequently; this block is a best-effort stub.
  // Real test infra typically uses Stripe's `payment_intents.confirm` API
  // through a fixture, then drives the success URL directly.
  await page.fill('[name="email"], input[type="email"]', "buyer+e2e@copypastelearn.com").catch(() => {});
  // Card iframes — these selectors are intentionally generic; teams should
  // pin to current Stripe Checkout DOM and add per-locale selectors.
  test.skip(
    true,
    "Stripe-hosted Checkout DOM is not stable enough to drive headlessly without iframe-specific helpers — finalize selectors when Stripe test infra is wired.",
  );

  await expect(page).toHaveURL(/checkout\/success/);
});
