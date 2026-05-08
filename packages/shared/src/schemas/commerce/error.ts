import { z } from "zod";

// Mirrors specs/002-agentic-commerce/contracts/schemas/error.schema.json
export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string().regex(/^[a-z][a-z0-9_]+$/),
    message: z.string(),
    details: z.array(z.unknown()).optional(),
  }),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

export type ApiErrorCode =
  | "validation_failed"
  | "not_found"
  | "unauthorized"
  | "forbidden"
  | "rate_limited"
  | "unsupported_payment_method"
  | "token_expired_or_consumed"
  | "signature_failed"
  | "internal_error"
  | "duplicate_event"
  | "product_unavailable";

export function apiError(
  code: ApiErrorCode | string,
  message: string,
  details?: unknown[],
): ApiError {
  return { error: { code, message, ...(details ? { details } : {}) } };
}
