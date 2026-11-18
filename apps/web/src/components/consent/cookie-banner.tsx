"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  CONSENT_OPEN_EVENT,
  readConsent,
  saveConsent,
  type ConsentChoice,
} from "@/lib/consent";

/**
 * Cookie consent banner (first-party, no consent SaaS).
 *
 * Shown until the visitor chooses. "Accept all" and "Reject all" have the
 * same size and style; "Customize" lets them pick analytics and marketing
 * separately. The footer "Cookie settings" link reopens it.
 */
export function CookieBanner() {
  const [open, setOpen] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const firstButton = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const current = readConsent();
    if (!current) setOpen(true);

    const reopen = () => {
      const c = readConsent();
      setAnalytics(c?.analytics ?? false);
      setMarketing(c?.marketing ?? false);
      setCustomize(Boolean(c));
      setOpen(true);
      // Move focus into the banner when the visitor asked for it.
      requestAnimationFrame(() => firstButton.current?.focus());
    };
    window.addEventListener(CONSENT_OPEN_EVENT, reopen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, reopen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      // Escape closes a reopened banner; a first-time visitor must choose.
      if (e.key === "Escape" && readConsent()) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  const choose = (choice: ConsentChoice) => {
    setOpen(false);
    saveConsent(choice);
  };

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      aria-describedby={descId}
      className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:inset-x-auto sm:bottom-4 sm:left-4 sm:max-w-md sm:p-0"
    >
      <div className="rounded-lg border bg-background p-4 text-sm shadow-lg">
        <h2 id={titleId} className="font-semibold">
          Cookies
        </h2>
        <p id={descId} className="mt-1 text-muted-foreground">
          With your consent we use cookies for analytics (Google Analytics,
          Microsoft Clarity) and for advertising (Google Ads, Meta, LinkedIn,
          Reddit) to measure our campaigns. No optional cookies are set until
          you choose. See our{" "}
          <Link href="/privacy#cookies" className="underline underline-offset-4 hover:text-foreground">
            privacy policy
          </Link>
          .
        </p>

        {customize && (
          <fieldset className="mt-3 space-y-2">
            <legend className="sr-only">Cookie categories</legend>
            <label className="flex items-start gap-2">
              <input type="checkbox" checked disabled className="mt-0.5 h-4 w-4" />
              <span>
                <span className="font-medium">Necessary</span>
                <span className="block text-xs text-muted-foreground">
                  Sign-in, checkout and this choice. Always on.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-primary"
              />
              <span>
                <span className="font-medium">Analytics</span>
                <span className="block text-xs text-muted-foreground">
                  Google Analytics cookies and Microsoft Clarity.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-primary"
              />
              <span>
                <span className="font-medium">Marketing</span>
                <span className="block text-xs text-muted-foreground">
                  Ad conversion tags from Google Ads, Meta, LinkedIn and Reddit.
                </span>
              </span>
            </label>
          </fieldset>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button
            ref={firstButton}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => choose({ analytics: false, marketing: false })}
          >
            Reject all
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => choose({ analytics: true, marketing: true })}
          >
            Accept all
          </Button>
        </div>
        <div className="mt-2 text-center">
          {customize ? (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto p-0"
              onClick={() => choose({ analytics, marketing })}
            >
              Save my choices
            </Button>
          ) : (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto p-0 text-muted-foreground"
              onClick={() => setCustomize(true)}
            >
              Customize
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
