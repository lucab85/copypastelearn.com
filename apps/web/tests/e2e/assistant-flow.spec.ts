import { test } from "@playwright/test";

/**
 * T086 [US6] — Assistant flow end-to-end.
 *
 * Skipped pending Stripe + assistant fixtures.
 *
 * Flow:
 *   1. Visit /shop (or any page where AssistantPanel is mounted).
 *   2. Type "terraform aws book" → Ask.
 *   3. Assert recommendation list renders with a price loaded from
 *      catalog (no hallucination).
 *   4. Click "Buy" → navigates to a Stripe-hosted checkout URL.
 *   5. Complete payment in Stripe test mode.
 *   6. Assert one `chat_recommendation_shown` and one
 *      `chat_checkout_clicked` analytics event were recorded.
 */
test.skip("assistant: query → recommendations → checkout-clicked → checkout session created", async ({
  page,
}) => {
  await page.goto("/shop");
});
