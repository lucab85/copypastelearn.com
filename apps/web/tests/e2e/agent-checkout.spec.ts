import { test } from "@playwright/test";

/** T099 [US8] — SC-012 — agent E2E. Skip-marked pending Stripe + agent fixtures. */
test.skip("agent: capabilities → products → checkout → complete payment → orders/{id}", async () => {
  // 1. GET /api/agent/capabilities → assert schema-valid
  // 2. GET /api/agent/products?limit=1 → take first product id
  // 3. POST /api/agent/checkout {items, payment.type=stripe_checkout}
  //    → follow redirect → complete card payment in Stripe test mode
  // 4. GET /api/agent/orders/{order_id} → status=PAID, delivery_state=delivered
});
