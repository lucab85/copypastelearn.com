"use client";

import { useEffect, useState } from "react";
import { inOfferWindow } from "@/lib/launch-offer";
import Link from "next/link";
import { X } from "lucide-react";

interface AnnouncementBannerProps {
  message: string;
  linkText?: string;
  linkHref?: string;
  externalLink?: boolean;
  /**
   * A time-limited message shown instead, on the visitor's clock (the layout
   * is cached, so the switch happens in the browser).
   */
  offer?: { message: string; linkText: string; linkHref: string; start: string; end: string };
}

export function AnnouncementBanner({
  message,
  linkText,
  linkHref,
  externalLink = false,
  offer,
}: AnnouncementBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [offerOn, setOfferOn] = useState(false);

  useEffect(() => {
    if (offer && inOfferWindow(offer.start, offer.end)) setOfferOn(true);
  }, [offer]);

  if (dismissed) return null;
  const shown =
    offerOn && offer
      ? { message: offer.message, linkText: offer.linkText, linkHref: offer.linkHref, externalLink: false }
      : { message, linkText, linkHref, externalLink };

  return (
    <div className="relative bg-gradient-to-r from-primary to-primary/80 px-4 py-2 text-center text-sm text-primary-foreground">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2">
        <span>{shown.message}</span>
        {shown.linkText && shown.linkHref && (
          shown.externalLink ? (
            <a
              href={shown.linkHref}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:opacity-80"
            >
              {shown.linkText} →
            </a>
          ) : (
            <Link
              href={shown.linkHref}
              className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:opacity-80"
            >
              {shown.linkText} →
            </Link>
          )
        )}
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 hover:bg-primary-foreground/20"
        aria-label="Dismiss announcement"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
