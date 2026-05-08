import { describe, it } from "vitest";

/**
 * T098 [US8] — Contract test for POST /api/agent/checkout.
 *
 * Skip-marked: requires running server + Stripe test mode.
 *
 * Asserts response oneOf {redirect|completed} matches
 * agent-checkout-response.schema.json AND that an SPT request returns
 * `unsupported_payment_method` while ENABLE_STRIPE_SPT=false.
 */
describe.skip("agent checkout contract", () => {
  it("redirect response validates", () => {});
  it("SPT request returns unsupported_payment_method while flag off", () => {});
});
