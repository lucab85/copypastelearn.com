"use client";

import { useEffect, useState } from "react";
import { TrackedLink } from "@/components/analytics/tracked-link";

/**
 * Phone only: the two calls to action stay at the bottom of the screen once
 * the visitor has scrolled past the hero buttons.
 */
export function StickyCta({ freeHref }: { freeHref: string | null }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 640);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 p-3 backdrop-blur transition-transform md:hidden ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!show}
    >
      <div className="flex gap-2">
        {freeHref && (
          <TrackedLink
            href={freeHref}
            ctaText="Free lesson"
            ctaLocation="academy_sticky"
            tabIndex={show ? 0 : -1}
            className="flex h-11 flex-1 items-center justify-center rounded-lg border text-sm font-semibold"
          >
            Free lesson
          </TrackedLink>
        )}
        <TrackedLink
          href="/pricing"
          ctaText="Get Pro"
          ctaLocation="academy_sticky"
          tabIndex={show ? 0 : -1}
          className="flex h-11 flex-1 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground"
        >
          Unlock every course
        </TrackedLink>
      </div>
    </div>
  );
}
