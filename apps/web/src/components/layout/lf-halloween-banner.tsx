"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";
import { trackEvent } from "@/lib/analytics";

/**
 * Linux Foundation Halloween flash promo: 35% off training and certifications
 * sitewide on Oct 28–29, 2026 with a personal code. Images are hosted
 * centrally on lucaberton.com (/promo/lf-halloween-2026/). The banner is
 * rendered hidden and shown only on Oct 28–29 in the visitor's time zone: by
 * the inline script on page load, by the effect after client-side navigation.
 * The link is the Awin tracking link from the LF announcement. Clicking copies
 * the code (best effort, never blocks navigation) and then follows it.
 * Remove after the promo (Oct 29, 2026).
 */
const HREF =
  "https://www.awin1.com/cread.php?awinmid=85919&awinaffid=1937397&ued=https%3A%2F%2Ftraining.linuxfoundation.org%2Foctober-2026-flash%2F";
const CODE = "TREATS35LUCA";
const IMG = "https://lucaberton.com/promo/lf-halloween-2026";
const ALT =
  "Linux Foundation Halloween flash sale, October 28–29: 35% off all training and certifications with code TREATS35LUCA";

// The promo runs Oct 28–29, 2026 on each visitor's own clock.
const inPromo = () => {
  const now = new Date();
  return now >= new Date(2026, 9, 28) && now < new Date(2026, 9, 30);
};
// The same check, inlined after the server-rendered banner so it shows before first paint.
const SHOW = `(function(){var n=new Date();if(n>=new Date(2026,9,28)&&n<new Date(2026,9,30))document.querySelectorAll("[data-lf-promo]").forEach(function(e){e.hidden=false})})()`;

export function LfHalloweenBanner() {
  const pathname = usePathname();
  const ref = useRef<HTMLElement>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (ref.current && inPromo()) ref.current.hidden = false;
  }, []);

  function onClick(e: MouseEvent<HTMLAnchorElement>) {
    trackEvent("promo_banner_click", {
      campaign: "lf-halloween-2026",
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
    <>
      <aside
        ref={ref}
        hidden
        suppressHydrationWarning
        data-lf-promo
        aria-label="Linux Foundation training: 35% off on October 28–29"
        className="mx-auto w-full max-w-3xl px-4 pt-4"
      >
        <a
          href={HREF}
          rel="nofollow sponsored noopener"
          data-lf-promo-code={CODE}
          onClick={onClick}
          className="block overflow-hidden rounded-2xl shadow-lg transition-shadow hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <picture>
            <source
              media="(max-width: 640px)"
              type="image/webp"
              srcSet={`${IMG}/card-800.webp 800w, ${IMG}/card-1200.webp 1200w, ${IMG}/card-1595.webp 1595w`}
              sizes="100vw"
              width={1595}
              height={829}
            />
            <source media="(max-width: 640px)" srcSet={`${IMG}/card.jpg`} width={1595} height={829} />
            <source type="image/webp" srcSet={`${IMG}/wide.webp`} width={1200} height={300} />
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
          35% off Linux Foundation training and certifications, Oct 28–29 — use code{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-semibold text-foreground">{CODE}</code> at checkout
          <span className="ml-1 font-medium text-green-700 dark:text-green-400" role="status" aria-live="polite">
            {status}
          </span>
          <span className="block text-xs">Affiliate link: Luca earns a commission on purchases made with this code.</span>
        </p>
      </aside>
      <script dangerouslySetInnerHTML={{ __html: SHOW }} />
    </>
  );
}
