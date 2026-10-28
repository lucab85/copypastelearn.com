"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";
import { trackEvent } from "@/lib/analytics";
import promoJson from "@/generated/promo.json";

/**
 * Sponsored banner, the same campaign on all of Luca's sites. It renders
 * src/generated/promo.json, which scripts/sync-promo.mjs writes at the start of
 * every build from lucaberton.com/promo/promos.json (source and how-to: the
 * lucaberton.com repo, docs/promo-banners.md). Images are hosted centrally on
 * lucaberton.com.
 *
 * Shown only inside the campaign window: the inline script before the banner
 * flags <html> while the page is parsed (no layout shift), the effect does the
 * same after client-side navigation, and the CSS hides it otherwise. Clicking
 * copies the code (best effort, never blocks navigation) and follows the link.
 */
interface Promo {
  id: string;
  start: string;
  end: string;
  href: string;
  code: string | null;
  alt: string;
  caption: string;
  disclosure: string | null;
  image: { base: string; wide: { width: number; height: number }; card: { width: number; height: number } };
  tracking: { campaign: string };
  script: string;
  css: string;
}

const promo = promoJson as unknown as Promo | null;

// The campaign window on the visitor's own clock: from local midnight on
// `start` until the `end` instant (the same test as promo.script).
const inWindow = (p: Promo) => {
  const [y, m, d] = p.start.split("-").map(Number);
  const now = Date.now();
  return now >= new Date(y, m - 1, d).getTime() && now < Date.parse(p.end);
};

export function PromoBanner() {
  const pathname = usePathname();
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (promo && inWindow(promo)) document.documentElement.setAttribute("data-promo-on", "");
  }, []);

  if (!promo) return null;
  const { image: img, code } = promo;

  function onClick(e: MouseEvent<HTMLAnchorElement>) {
    trackEvent("promo_banner_click", {
      campaign: promo!.tracking.campaign,
      promo_code: code ?? undefined,
      placement: "site_header_below",
      page_path: pathname,
    });
    if (!code || !navigator.clipboard || e.defaultPrevented) return;
    const copy = navigator.clipboard.writeText(code).then(() => {
      setStatus(`${code} copied — paste it at checkout`);
    });
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    const href = e.currentTarget.href;
    const go = () => window.location.assign(href);
    Promise.race([copy, new Promise((r) => setTimeout(r, 300))]).then(go, go);
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: promo.css }} />
      <script dangerouslySetInnerHTML={{ __html: promo.script }} />
      <aside data-promo aria-label={promo.caption} className="mx-auto w-full max-w-3xl px-4 pt-4">
        <a
          href={promo.href}
          rel="nofollow sponsored noopener"
          data-promo-code={code ?? undefined}
          onClick={onClick}
          className="block overflow-hidden rounded-2xl shadow-lg transition-shadow hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <picture>
            <source
              media="(max-width: 640px)"
              type="image/webp"
              srcSet={`${img.base}/card-800.webp 800w, ${img.base}/card-1200.webp 1200w`}
              sizes="100vw"
              width={img.card.width}
              height={img.card.height}
            />
            <source media="(max-width: 640px)" srcSet={`${img.base}/card.jpg`} width={img.card.width} height={img.card.height} />
            <source type="image/webp" srcSet={`${img.base}/wide.webp`} width={img.wide.width} height={img.wide.height} />
            <img
              src={`${img.base}/wide.jpg`}
              width={img.wide.width}
              height={img.wide.height}
              alt={promo.alt}
              loading="lazy"
              decoding="async"
              className="block h-auto w-full"
            />
          </picture>
        </a>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {promo.caption}
          {code && (
            <>
              {" "}— use code <code className="rounded bg-muted px-1.5 py-0.5 font-semibold text-foreground">{code}</code> at checkout
            </>
          )}
          <span className="ml-1 font-medium text-green-700 dark:text-green-400" role="status" aria-live="polite">
            {status}
          </span>
          {promo.disclosure && <span className="block text-xs">{promo.disclosure}</span>}
        </p>
      </aside>
    </>
  );
}
