"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

/**
 * T062 [US3] — ArticleCTA: brand-aware purchase CTA for embedding on
 * AnsiblePilot/TerraformPilot articles (or anywhere on copypastelearn.com).
 *
 * Renders a styled card linking to a product slug with attribution
 * UTM params appended. Fires `cta_view` on first viewport-intersection
 * and `cta_click` on activation, both as best-effort POSTs to
 * `/api/analytics/cta` (server-side recorded via T065).
 *
 * For non-React sibling sites use `public/widgets/article-cta.js` (T063).
 */

type Brand = "ansiblepilot" | "terraformpilot" | "copypastelearn";

const BRAND_THEME: Record<
  Brand,
  { label: string; accent: string; ring: string }
> = {
  ansiblepilot: {
    label: "AnsiblePilot",
    accent: "bg-rose-600 hover:bg-rose-500",
    ring: "ring-rose-200",
  },
  terraformpilot: {
    label: "TerraformPilot",
    accent: "bg-violet-600 hover:bg-violet-500",
    ring: "ring-violet-200",
  },
  copypastelearn: {
    label: "CopyPasteLearn",
    accent: "bg-zinc-900 hover:bg-zinc-800",
    ring: "ring-zinc-200",
  },
};

export interface ArticleCTAProps {
  productSlug: string;
  title: string;
  blurb: string;
  ctaLabel?: string;
  brand?: Brand;
  /** Source domain (e.g. "ansiblepilot.com"). Defaults to brand label. */
  utmSource?: string;
  utmCampaign?: string;
  /** Slug or id of the embedding article — populates utm_content. */
  articleId?: string;
}

function buildHref(p: ArticleCTAProps): string {
  const params = new URLSearchParams();
  const source =
    p.utmSource ??
    (p.brand && p.brand !== "copypastelearn"
      ? `${p.brand}.com`
      : "copypastelearn.com");
  params.set("utm_source", source);
  params.set("utm_medium", "article-cta");
  if (p.utmCampaign) params.set("utm_campaign", p.utmCampaign);
  if (p.articleId) params.set("utm_content", p.articleId);
  return `/products/${p.productSlug}?${params.toString()}`;
}

function ping(eventType: "cta_view" | "cta_click", payload: object): void {
  try {
    const body = JSON.stringify({ type: eventType, ...payload });
    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      navigator.sendBeacon(
        "/api/analytics/cta",
        new Blob([body], { type: "application/json" }),
      );
      return;
    }
    void fetch("/api/analytics/cta", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    // best-effort
  }
}

export function ArticleCTA(props: ArticleCTAProps) {
  const brand = props.brand ?? "copypastelearn";
  const theme = BRAND_THEME[brand];
  const cardRef = useRef<HTMLDivElement | null>(null);
  const seenRef = useRef(false);

  useEffect(() => {
    if (!cardRef.current || seenRef.current) return;
    const el = cardRef.current;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !seenRef.current) {
            seenRef.current = true;
            ping("cta_view", {
              productSlug: props.productSlug,
              brand,
              utmCampaign: props.utmCampaign,
              articleId: props.articleId,
            });
            obs.disconnect();
          }
        }
      },
      { threshold: 0.5 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [props.productSlug, props.utmCampaign, props.articleId, brand]);

  const href = buildHref(props);

  return (
    <div
      ref={cardRef}
      className={`my-6 flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm ring-1 ${theme.ring} dark:border-zinc-800 dark:bg-zinc-950 sm:flex-row sm:items-center sm:justify-between`}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {theme.label} · CopyPasteLearn
        </p>
        <h3 className="mt-1 text-lg font-semibold leading-tight">
          {props.title}
        </h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {props.blurb}
        </p>
      </div>
      <Link
        href={href}
        onClick={() =>
          ping("cta_click", {
            productSlug: props.productSlug,
            brand,
            utmCampaign: props.utmCampaign,
            articleId: props.articleId,
          })
        }
        className={`inline-flex shrink-0 items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white ${theme.accent}`}
      >
        {props.ctaLabel ?? "Get the playbook"}
      </Link>
    </div>
  );
}
