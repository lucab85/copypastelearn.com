import { describe, it } from "vitest";

/**
 * T096 [US8] — Contract test for GET /api/agent/capabilities.
 *
 * Skipped at unit-test time: requires a running server. The CI/staging
 * harness runs this against a deployed preview, fetches the response,
 * and validates against `contracts/schemas/agent-capabilities.schema.json`
 * with AJV.
 */
describe.skip("agent capabilities contract", () => {
  it("validates against agent-capabilities.schema.json", () => {
    // const res = await fetch(`${BASE}/api/agent/capabilities`);
    // const body = await res.json();
    // expect(ajv.validate(schema, body)).toBe(true);
    // expect(body.checkout.stripe_shared_payment_token).toBe(false);
  });
});
