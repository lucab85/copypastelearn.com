import { describe, it } from "vitest";

/**
 * T028 [US1] — Contract test for `GET /api/products/{id}`.
 *
 * Skip-marked: requires a running server.
 */
describe.skip("products detail contract", () => {
  it("validates against product.schema.json", () => {});
  it("returns 404 for archived/draft products", () => {});
});
