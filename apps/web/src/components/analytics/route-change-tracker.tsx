"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  DEFAULT_CURRENCY,
  DEFAULT_PURCHASE_VALUE,
  trackPageView,
  trackPurchase,
  trackPurchaseOnce,
} from "@/lib/analytics";
import { adsPageView } from "@/lib/ads";
import { getCheckoutConversion } from "@/server/actions/billing";

/**
 * Tracks SPA route changes as GA4 page_view events.
 * Also detects checkout=success for purchase tracking.
 * Must be rendered inside a <Suspense> boundary.
 */
export function RouteChangeTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastUrl = useRef<string | null>(null);

  useEffect(() => {
    // The initial page view is sent by the GA config in the root layout
    // (and by each ad tag when it loads); only count later navigations to
    // a different URL (also ignores the dev-mode double effect run).
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    const previous = lastUrl.current;
    lastUrl.current = url;
    if (previous !== null && previous !== url) {
      trackPageView(url);
      adsPageView();
    }

    // Detect successful Stripe subscription checkout redirect
    if (searchParams?.get("checkout") === "success") {
      const sessionId = searchParams.get("session_id");
      if (!sessionId) {
        // Older success URL without the session id: default value.
        trackPurchase();
        return;
      }
      // Real amount and currency from the Stripe session; default only
      // if the lookup fails. Fired once per session id.
      const fallback = () =>
        trackPurchaseOnce(sessionId, DEFAULT_CURRENCY, DEFAULT_PURCHASE_VALUE);
      getCheckoutConversion(sessionId)
        .then((c) => (c ? trackPurchaseOnce(c.transactionId, c.currency, c.value) : fallback()))
        .catch(fallback);
    }
  }, [pathname, searchParams]);

  return null;
}
