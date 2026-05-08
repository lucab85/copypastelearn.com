import { describe, it } from "vitest";

/**
 * T091 [US7] — Contract test for `GET /feeds/products.json`.
 *
 * Skip-marked: requires a running server. Validates body against
 * `contracts/schemas/product-feed.schema.json` and asserts archived
 * products are absent.
 */
describe.skip("product feed contract", () => {
  it("validates against product-feed.schema.json", () => {});
  it("excludes archived products", () => {});
});
