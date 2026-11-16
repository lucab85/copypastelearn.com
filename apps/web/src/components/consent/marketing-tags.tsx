"use client";

import { useEffect } from "react";
import { loadAdTags } from "@/lib/ads";
import { onConsentChange } from "@/lib/consent";

/**
 * Loads the configured ad tags (see `@/lib/ads`) once the visitor has
 * granted marketing consent: on mount for returning visitors, or right
 * after they accept. Renders nothing.
 */
export function MarketingTags() {
  useEffect(() => {
    loadAdTags();
    return onConsentChange((state) => {
      if (state.marketing) loadAdTags();
    });
  }, []);

  return null;
}
