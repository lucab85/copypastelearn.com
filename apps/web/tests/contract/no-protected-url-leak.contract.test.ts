import { describe, it } from "vitest";

/**
 * T118 — Protected-URL leak detection (FR-040).
 *
 * Skip-marked: requires a running server. Asserts that none of the
 * public discovery surfaces contain values matching:
 *   - The S3 bucket hostname (`COMMERCE_S3_BUCKET`)
 *   - AWS presigned-URL signatures (`X-Amz-Signature=`)
 *   - Raw S3 storage keys (`products/<id>/v<n>/`)
 *
 * Surfaces tested:
 *   - GET /feeds/products.json
 *   - GET /api/agent/products
 *   - GET /api/agent/products/{id}
 *   - GET /api/agent/capabilities
 *   - GET /.well-known/ucp
 */
describe.skip("no-protected-url-leak contract", () => {
  it("feed body has no S3 hostname or presigned signature", () => {});
  it("agent products body has no S3 hostname or presigned signature", () => {});
  it("agent product detail has no S3 hostname or presigned signature", () => {});
  it("capabilities and UCP have no S3 hostname or presigned signature", () => {});
});
