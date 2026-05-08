import { describe, it, expect, beforeEach, vi } from "vitest";

// Force Upstash env to be present so we exercise the wired path.
process.env.UPSTASH_REDIS_REST_URL = "http://localhost:6379";
process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";

// Mock Upstash modules before importing the SUT.
const ratelimitInstances: Array<{ limit: ReturnType<typeof vi.fn> }> = [];
vi.mock("@upstash/redis", () => ({
  Redis: class {
    constructor(_opts: unknown) {}
  },
}));
vi.mock("@upstash/ratelimit", () => {
  const Ratelimit = class {
    static slidingWindow(max: number, window: string) {
      return { kind: "slidingWindow", max, window };
    }
    limit = vi.fn(async () => ({
      success: true,
      limit: 60,
      remaining: 59,
      reset: Date.now() + 60_000,
    }));
    constructor(_opts: unknown) {
      ratelimitInstances.push(this);
    }
  };
  return { Ratelimit };
});

import {
  rateLimit,
  __resetRateLimitForTests,
} from "@/lib/ratelimit";

beforeEach(() => {
  __resetRateLimitForTests();
  ratelimitInstances.length = 0;
});

describe("rateLimit", () => {
  it("returns success=true when Upstash allows the request", async () => {
    const result = await rateLimit("agent:ip", "1.2.3.4");
    expect(result.success).toBe(true);
    expect(result.limit).toBeGreaterThan(0);
  });

  it("supports multiple buckets and reuses limiter instances per bucket", async () => {
    await rateLimit("agent:ip", "a");
    await rateLimit("agent:ip", "b");
    await rateLimit("download:ip", "c");
    // One instance per bucket (cached).
    expect(ratelimitInstances.length).toBe(2);
  });

  it("fails open when Upstash env is missing", async () => {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const tok = process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    __resetRateLimitForTests();
    try {
      const r = await rateLimit("feed:ip", "x");
      expect(r.success).toBe(true);
    } finally {
      process.env.UPSTASH_REDIS_REST_URL = url;
      process.env.UPSTASH_REDIS_REST_TOKEN = tok;
    }
  });
});
