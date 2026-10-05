"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";
import { trackEvent } from "@/lib/analytics";

/**
 * AGNTCon + MCPCon North America 2026 (Oct 22-23, San Jose) with a 25% code.
 * Images are hosted centrally on lucaberton.com (/promo/agntcon-na-2026/).
 * Clicking copies the code (best effort, never blocks navigation) and opens the
 * Linux Foundation registration page. Remove after the event (Oct 23, 2026).
 */
const REGISTER_URL = "https://register.linuxfoundation.org/agntcon-mcpcon-na-2026";
const CODE = "LUCA25";
const IMG = "https://lucaberton.com/promo/agntcon-na-2026";
const ALT =
  "AGNTCon and MCPCon North America 2026, October 22–23, San Jose — save 25% with code LUCA25";

export function AgntConBanner() {
  const pathname = usePathname();
  const [status, setStatus] = useState("");

  function onClick(e: MouseEvent<HTMLAnchorElement>) {
    trackEvent("agntcon_banner_click", {
      campaign: "agntcon-2026",
      promo_code: CODE,
      placement: "site_header_below",
      page_path: pathname,
    });
    if (!navigator.clipboard || e.defaultPrevented) return;
    const copy = navigator.clipboard.writeText(CODE).then(() => {
      setStatus(`${CODE} copied — paste it at checkout`);
    });
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    const href = e.currentTarget.href;
    const go = () => window.location.assign(href);
    Promise.race([copy, new Promise((r) => setTimeout(r, 300))]).then(go, go);
  }

  return (
    <aside
      aria-label="AGNTCon + MCPCon North America 2026 discount"
      className="mx-auto w-full max-w-3xl px-4 pt-4"
    >
      <a
        href={REGISTER_URL}
        data-agntcon-code={CODE}
        onClick={onClick}
        className="block overflow-hidden rounded-2xl shadow-lg transition-shadow hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <picture>
          <source
            media="(max-width: 640px)"
            type="image/webp"
            srcSet={`${IMG}/card-800.webp 800w, ${IMG}/card-1200.webp 1200w, ${IMG}/card-1672.webp 1672w`}
            sizes="100vw"
          />
          <source media="(max-width: 640px)" srcSet={`${IMG}/card.jpg`} />
          <source type="image/webp" srcSet={`${IMG}/wide.webp`} />
          <img
            src={`${IMG}/wide.jpg`}
            width={1200}
            height={300}
            alt={ALT}
            loading="lazy"
            decoding="async"
            className="block h-auto w-full"
          />
        </picture>
      </a>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Save 25% — use code{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-semibold text-foreground">{CODE}</code> at checkout
        <span className="ml-1 font-medium text-green-700 dark:text-green-400" role="status" aria-live="polite">
          {status}
        </span>
      </p>
    </aside>
  );
}
