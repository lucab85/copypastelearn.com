// ─── Lab Session Constants ──────────────────────────────

export const LAB_DEFAULT_TTL_MINUTES = 60;
export const LAB_MAX_TTL_MINUTES = 120;
export const LAB_MAX_CONCURRENT_SESSIONS_PER_USER = 1;

export const LAB_SESSION_STATUSES = [
  "PROVISIONING",
  "READY",
  "RUNNING",
  "VALIDATING",
  "COMPLETED",
  "EXPIRED",
  "FAILED",
  "DESTROYED",
] as const;

export const LAB_TERMINAL_STATUSES = [
  "COMPLETED",
  "EXPIRED",
  "FAILED",
  "DESTROYED",
] as const;

export const LAB_ACTIVE_STATUSES = [
  "PROVISIONING",
  "READY",
  "RUNNING",
  "VALIDATING",
] as const;

// ─── Content Constants ──────────────────────────────────

export const DIFFICULTIES = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;
export const CONTENT_STATUSES = ["DRAFT", "PUBLISHED"] as const;
export const ROLES = ["LEARNER", "ADMIN"] as const;

// ─── Subscription Constants ─────────────────────────────

export const SUBSCRIPTION_STATUSES = [
  "ACTIVE",
  "CANCELED",
  "EXPIRED",
  "PAST_DUE",
] as const;

export const SUBSCRIPTION_PLAN_ID = "pro-monthly";
export const SUBSCRIPTION_PRICE_EUR = 29;

// ─── Sandbox Resource Limits ────────────────────────────

export const SANDBOX_DEFAULT_MEMORY_LIMIT = "512m";
export const SANDBOX_DEFAULT_CPU_LIMIT = "1.0";
export const SANDBOX_MAX_OUTPUT_BYTES = 64 * 1024; // 64 KB

// ─── SSE Heartbeat ──────────────────────────────────────

export const SSE_HEARTBEAT_INTERVAL_MS = 30_000;

// ─── Caching ────────────────────────────────────────────

export const CACHE_REVALIDATE_CATALOG = 3600; // 1 hour

// ─── API Error Codes ────────────────────────────────────

export const ERROR_CODES = {
  INVALID_REQUEST: "INVALID_REQUEST",
  SESSION_LIMIT_REACHED: "SESSION_LIMIT_REACHED",
  SESSION_NOT_FOUND: "SESSION_NOT_FOUND",
  SESSION_NOT_RUNNING: "SESSION_NOT_RUNNING",
  INVALID_STEP: "INVALID_STEP",
  VALIDATION_IN_PROGRESS: "VALIDATION_IN_PROGRESS",
  PROVISIONING_UNAVAILABLE: "PROVISIONING_UNAVAILABLE",
  CONTAINER_CRASHED: "CONTAINER_CRASHED",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
} as const;
