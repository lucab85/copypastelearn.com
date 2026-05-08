import { db } from "@/lib/db";
import { serverLogger } from "@/lib/logger";

/**
 * Server-side commerce analytics — persists structured events to the
 * AnalyticsEvent table for FR-049 / FR-050 reporting.
 *
 * NOTE: distinct from `@/lib/analytics`, which is the client-side GA4
 * helper (gtag wrapper). Commerce events live server-side so that
 * webhook-driven actions (checkout_completed, refund_completed) can
 * be recorded reliably.
 */

export type AnalyticsEventName =
  | "product_page_view"
  | "article_cta_view"
  | "article_cta_click"
  | "chat_recommendation_shown"
  | "chat_checkout_clicked"
  | "checkout_session_created"
  | "checkout_completed"
  | "checkout_abandoned"
  | "file_downloaded"
  | "refund_requested"
  | "refund_completed";

export const ANALYTICS_EVENT_NAMES: readonly AnalyticsEventName[] = [
  "product_page_view",
  "article_cta_view",
  "article_cta_click",
  "chat_recommendation_shown",
  "chat_checkout_clicked",
  "checkout_session_created",
  "checkout_completed",
  "checkout_abandoned",
  "file_downloaded",
  "refund_requested",
  "refund_completed",
] as const;

export interface AnalyticsContext {
  customerId?: string;
  orderId?: string;
  productId?: string;
  bundleId?: string;
  sourceDomain?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  metadata?: Record<string, unknown>;
}

/** Persist a commerce analytics event. Failures never block the caller. */
export async function recordCommerceEvent(
  type: AnalyticsEventName,
  context: AnalyticsContext = {},
): Promise<void> {
  try {
    await db.analyticsEvent.create({
      data: {
        type,
        customerId: context.customerId,
        orderId: context.orderId,
        productId: context.productId,
        bundleId: context.bundleId,
        sourceDomain: context.sourceDomain,
        utmSource: context.utmSource,
        utmMedium: context.utmMedium,
        utmCampaign: context.utmCampaign,
        metadata: context.metadata as object | undefined,
      },
    });
  } catch (err) {
    serverLogger.warn(
      { err: err instanceof Error ? err.message : String(err), type },
      "commerce.analytics.failed",
    );
  }
}
