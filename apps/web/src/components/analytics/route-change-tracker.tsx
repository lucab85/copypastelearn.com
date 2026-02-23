"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView, trackPurchase } from "@/lib/analytics";

/**
 * Tracks SPA route changes as GA4 page_view events.
 * Also detects checkout=success for purchase tracking.
 * Must be rendered inside a <Suspense> boundary.
 */
export function RouteChangeTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    trackPageView(url);

    // Detect successful Stripe checkout redirect
    if (searchParams?.get("checkout") === "success") {
      trackPurchase(undefined, "EUR", 29);
    }
  }, [pathname, searchParams]);

  return null;
}
