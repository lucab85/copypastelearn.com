"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

interface AnnouncementBannerProps {
  message: string;
  linkText?: string;
  linkHref?: string;
  externalLink?: boolean;
}

export function AnnouncementBanner({
  message,
  linkText,
  linkHref,
  externalLink = false,
}: AnnouncementBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="relative bg-gradient-to-r from-primary to-primary/80 px-4 py-2 text-center text-sm text-primary-foreground">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2">
        <span>{message}</span>
        {linkText && linkHref && (
          externalLink ? (
            <a
              href={linkHref}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:opacity-80"
            >
              {linkText} →
            </a>
          ) : (
            <Link
              href={linkHref}
              className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:opacity-80"
            >
              {linkText} →
            </Link>
          )
        )}
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 hover:bg-primary-foreground/20"
        aria-label="Dismiss announcement"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
