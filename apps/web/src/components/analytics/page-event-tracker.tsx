"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

interface PageEventTrackerProps {
  event: string;
  params?: Record<string, string | number | boolean | undefined>;
}

/**
 * Drop into any server component page to fire a GA4 event on mount.
 * Renders nothing visible.
 */
export function PageEventTracker({ event, params }: PageEventTrackerProps) {
  useEffect(() => {
    trackEvent(event, params);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
