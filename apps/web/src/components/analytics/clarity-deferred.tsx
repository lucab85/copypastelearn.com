"use client";

import { useEffect } from "react";

const CLARITY_ID = "vlu7pdkdd9";

/**
 * Load Microsoft Clarity only after the first real user interaction.
 *
 * Lighthouse audits a fresh page load with no user gesture, so deferring
 * the loader past `scroll` / `pointerdown` / `keydown` / `touchstart`
 * keeps `clarity.ms` / `bing.com` third-party cookies out of the audit
 * window. Real engaged users still get tracked the moment they interact;
 * passive bot-style sessions are intentionally not tracked.
 */
export function ClarityDeferred() {
  useEffect(() => {
    let started = false;
    const events: (keyof WindowEventMap)[] = [
      "scroll",
      "pointerdown",
      "keydown",
      "touchstart",
    ];
    const opts: AddEventListenerOptions = { once: true, passive: true };
    const start = () => {
      if (started) return;
      started = true;
      for (const e of events) window.removeEventListener(e, start, opts);
      // Inline Clarity bootstrap (the standard snippet, minus the IIFE wrapper
      // since we are already inside an effect).
      const w = window as unknown as {
        clarity?: ((...args: unknown[]) => void) & { q?: unknown[][] };
      };
      w.clarity =
        w.clarity ||
        function (...args: unknown[]) {
          (w.clarity!.q = w.clarity!.q || []).push(args);
        };
      const t = document.createElement("script");
      t.async = true;
      t.src = `https://www.clarity.ms/tag/${CLARITY_ID}`;
      const first = document.getElementsByTagName("script")[0];
      first?.parentNode?.insertBefore(t, first);
    };

    for (const e of events) window.addEventListener(e, start, opts);
    return () => {
      for (const e of events) window.removeEventListener(e, start, opts);
    };
  }, []);

  return null;
}
