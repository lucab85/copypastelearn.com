import { test } from "@playwright/test";

/**
 * T061 [US3] — CTA → attributed sale.
 *
 * Skipped pending Stripe + Clerk fixtures shared with T032/T050.
 *
 * Flow:
 *   1. Visit /products/<slug>?utm_source=ansiblepilot.com
 *      &utm_campaign=cta-test&utm_content=article-id-123
 *   2. Click Buy → Stripe test checkout → complete with 4242…
 *   3. Open the Order in Prisma and assert
 *      utmSource === "ansiblepilot.com",
 *      utmCampaign === "cta-test",
 *      utmContent === "article-id-123".
 */
test.skip("CTA UTM params persist on Order via Stripe metadata round-trip", async ({
  page,
}) => {
  await page.goto(
    "/products/ansible-automation-playbook?utm_source=ansiblepilot.com&utm_campaign=cta-test&utm_content=article-id-123",
  );
});
