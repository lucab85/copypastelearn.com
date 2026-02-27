"use client";

import Link from "next/link";
import { trackCtaClick } from "@/lib/analytics";
import type { ComponentProps } from "react";

interface TrackedLinkProps extends ComponentProps<typeof Link> {
  /** GA4 event label for the CTA text */
  ctaText: string;
  /** Where the CTA appears (e.g. "blog_post", "homepage") */
  ctaLocation: string;
}

export function TrackedLink({
  ctaText,
  ctaLocation,
  onClick,
  ...props
}: TrackedLinkProps) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        trackCtaClick(ctaText, ctaLocation, props.href as string);
        onClick?.(e);
      }}
    />
  );
}
