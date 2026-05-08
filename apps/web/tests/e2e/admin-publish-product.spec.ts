import { test } from "@playwright/test";

/**
 * T067 [US4] — Admin publishes a product end-to-end.
 *
 * Skipped pending Clerk admin fixture + S3 upload mock for E2E.
 * Shape preserved for staging wire-up.
 *
 * Flow:
 *   1. Sign in as Clerk admin.
 *   2. /admin/products/new → fill brand/type/price → create.
 *   3. /admin/products/[id] → upload sample PDF (T071).
 *   4. Set status PUBLISHED via T070.
 *   5. Hit /products/<slug> publicly → 200 with title + Buy button.
 *   6. Hit /feeds/products.json → item present with matching id.
 */
test.skip("admin: create → upload file → publish → product visible on storefront + feed", async ({
  page,
}) => {
  await page.goto("/admin/products/new");
});
