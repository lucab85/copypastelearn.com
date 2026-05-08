import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Upstash-backed rate limiter for commerce endpoints.
 *
 * Buckets per spec research §7:
 *   - agent:ip       60 req/min
 *   - feed:ip        30 req/min
 *   - download:ip    30 req/min
 *   - download:token 100 req/min (per token)
 *
 * Webhook handlers are NOT rate-limited (FR-019/FR-020 require we ack
 * every signed delivery to keep idempotency books square).
 */

const buckets = {
  "agent:ip": { limit: 60, window: "1 m" },
  "feed:ip": { limit: 30, window: "1 m" },
  "download:ip": { limit: 30, window: "1 m" },
  "download:token": { limit: 100, window: "1 m" },
  "regenerate:user": { limit: 10, window: "10 m" },
  "assistant:ip": { limit: 30, window: "1 m" },
} as const;

export type RateLimitBucket = keyof typeof buckets;

let redis: Redis | undefined;
const limiterCache = new Map<RateLimitBucket, Ratelimit>();

function getRedis(): Redis | undefined {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return undefined;
  redis = new Redis({ url, token });
  return redis;
}

function getLimiter(bucket: RateLimitBucket): Ratelimit | undefined {
  const cached = limiterCache.get(bucket);
  if (cached) return cached;
  const r = getRedis();
  if (!r) return undefined;
  const cfg = buckets[bucket];
  const limiter = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(cfg.limit, cfg.window),
    analytics: false,
    prefix: `cpl:rl:${bucket}`,
  });
  limiterCache.set(bucket, limiter);
  return limiter;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Apply a rate limit. If Upstash isn't configured (e.g. in tests),
 * the call returns `success: true` with synthetic numbers — fail-open
 * is intentional for non-prod, but production deployments MUST set
 * the env vars.
 */
export async function rateLimit(
  bucket: RateLimitBucket,
  key: string,
): Promise<RateLimitResult> {
  const limiter = getLimiter(bucket);
  const cfg = buckets[bucket];
  if (!limiter) {
    return {
      success: true,
      limit: cfg.limit,
      remaining: cfg.limit,
      reset: Date.now() + 60_000,
    };
  }
  const r = await limiter.limit(key);
  return {
    success: r.success,
    limit: r.limit,
    remaining: r.remaining,
    reset: r.reset,
  };
}

/** For tests only — drop the cached limiters / redis client. */
export function __resetRateLimitForTests(): void {
  limiterCache.clear();
  redis = undefined;
}
