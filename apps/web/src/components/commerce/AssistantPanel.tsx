"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

interface AssistantRecommendation {
  productId: string;
  slug: string;
  title: string;
  brand: string;
  productType: string;
  format: string;
  url: string;
  priceFormatted: string;
  currency: string;
  summary: string;
}

/**
 * T089 [US6] — Minimal storefront chat panel.
 *
 * Calls `/api/assistant/recommend`, renders catalog matches, and
 * exposes a "Buy now" button that POSTs to `/api/checkout/stripe`
 * (the same server-validated path as `BuyButton`). Emits a client
 * `chat_checkout_clicked` event on each click (FR-035).
 *
 * The assistant NEVER displays a price the server didn't return.
 */
export function AssistantPanel() {
  const [query, setQuery] = useState("");
  const [recs, setRecs] = useState<AssistantRecommendation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/assistant/recommend", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ query: query.trim() }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error?.message ?? "Could not get recommendations");
          setRecs([]);
          return;
        }
        setRecs(data.recommendations ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Network error");
      }
    });
  }

  async function buy(productId: string) {
    trackEvent("chat_checkout_clicked", { product_id: productId });
    // Best-effort server-side analytics record (FR-035) via a fire-and-forget
    // beacon to the recommend route is unnecessary — the actual checkout
    // route emits `checkout_session_created`, and the GA4 event above
    // covers the chat-attribution slice.
    const res = await fetch("/api/checkout/stripe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ items: [{ productId, quantity: 1 }] }),
    });
    const data = await res.json();
    if (res.ok && data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
    } else {
      setError(data?.error?.message ?? "Could not start checkout");
    }
  }

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
        <Sparkles className="h-4 w-4" aria-hidden />
        Ask the catalog
      </div>
      <form onSubmit={submit} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. terraform aws book"
          aria-label="Ask for a product recommendation"
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
          maxLength={500}
        />
        <Button type="submit" size="sm" disabled={pending || !query.trim()}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ask"}
        </Button>
      </form>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      {recs.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {recs.map((r) => (
            <li
              key={r.productId}
              className="flex items-start justify-between gap-3 rounded-md border p-3"
            >
              <div className="min-w-0">
                <a
                  href={r.url}
                  className="block font-medium hover:underline"
                >
                  {r.title}
                </a>
                <div className="text-xs text-muted-foreground">
                  {r.brand} · {r.productType} · €{r.priceFormatted}{" "}
                  {r.currency}
                </div>
                {r.summary ? (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {r.summary}
                  </p>
                ) : null}
              </div>
              <Button size="sm" onClick={() => buy(r.productId)}>
                Buy
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}
