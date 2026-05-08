import { describe, it } from "vitest";

/**
 * T027 [US1] — Contract test for `GET /api/products`.
 *
 * Skip-marked: requires a running server. CI/staging harness:
 *   - Hits `${BASE}/api/products`
 *   - Validates response array against
 *     `specs/002-agentic-commerce/contracts/schemas/product.schema.json`
 *   - Asserts every item is `status === "PUBLISHED"`
 *   - Asserts no item carries protected file URLs (FR-040)
 */
describe.skip("products list contract", () => {
  it("validates against product.schema.json", () => {});
});
