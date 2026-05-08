import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * T110 — logging-shape coverage.
 *
 * Asserts that `serverLogger`/`createActionLogger` accept the
 * structured fields we rely on in commerce routes:
 *   request_id, actor_id, order_id, event_id
 *
 * This test is a contract on the shape we expect to log in every
 * commerce route, not the call sites themselves. Call sites are
 * audited via the ops runbook (T112).
 */
describe("commerce logging shape", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("createActionLogger merges context fields without throwing", async () => {
    const { createActionLogger } = await import("@/lib/logger");
    const log = createActionLogger({ action: "test", userId: "u1" });
    expect(typeof log.info).toBe("function");
    expect(typeof log.warn).toBe("function");
    expect(typeof log.error).toBe("function");
  });

  it("serverLogger accepts the canonical commerce-correlation keys", async () => {
    const { serverLogger } = await import("@/lib/logger");
    expect(() =>
      serverLogger.info(
        {
          request_id: "req_test",
          actor_id: "u_test",
          order_id: "o_test",
          event_id: "evt_test",
        },
        "commerce.test",
      ),
    ).not.toThrow();
  });
});
