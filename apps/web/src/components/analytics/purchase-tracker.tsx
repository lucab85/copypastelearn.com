"use client";

import { useEffect } from "react";
import { trackPurchaseOnce } from "@/lib/analytics";

interface PurchaseTrackerProps {
  transactionId: string;
  /** Order total in major units (e.g. 49.0). */
  value: number;
  /** ISO 4217 code, upper case (e.g. "EUR"). */
  currency: string;
}

/**
 * Fires the purchase event (GA4 + ad conversions) with the real order
 * amount, once per transaction in this browser. Renders nothing.
 */
export function PurchaseTracker({ transactionId, value, currency }: PurchaseTrackerProps) {
  useEffect(() => {
    trackPurchaseOnce(transactionId, currency, value);
  }, [transactionId, currency, value]);

  return null;
}
