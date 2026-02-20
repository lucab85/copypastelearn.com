// ─── API Error Types ────────────────────────────────────

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// ─── API Response Helpers ───────────────────────────────

export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: ApiError["error"] };

// ─── Request/Response Common Types ──────────────────────

export interface PaginatedRequest {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ─── Webhook Event Types ────────────────────────────────

export interface ClerkWebhookEvent {
  type: string;
  data: Record<string, unknown>;
}

export interface StripeWebhookEvent {
  type: string;
  data: {
    object: Record<string, unknown>;
  };
}
