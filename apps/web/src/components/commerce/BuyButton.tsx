"use client";

import { useState } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

interface BuyButtonProps extends Omit<ButtonProps, "onClick"> {
  productId?: string;
  bundleId?: string;
  quantity?: number;
  children?: React.ReactNode;
}

/**
 * Storefront purchase CTA. POSTs to `/api/checkout/stripe` and
 * redirects the buyer to the returned Stripe-hosted checkout URL.
 *
 * NEVER carries an amount in the request payload — the server is the
 * sole source of truth for prices (FR-006).
 */
export function BuyButton({
  productId,
  bundleId,
  quantity = 1,
  children,
  ...props
}: BuyButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      trackEvent("begin_checkout");
      const res = await fetch("/api/checkout/stripe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items: [
            productId
              ? { productId, quantity }
              : { bundleId, quantity },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) {
        const msg = data?.error?.message ?? "Could not start checkout";
        setError(msg);
        setLoading(false);
        return;
      }
      window.location.href = data.checkoutUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
      setLoading(false);
    }
  }

  return (
    <div>
      <Button onClick={handleClick} disabled={loading} {...props}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Redirecting…
          </>
        ) : (
          (children ?? "Buy now")
        )}
      </Button>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
