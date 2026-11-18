"use client";

import { openConsentSettings } from "@/lib/consent";

/** Footer link that reopens the cookie consent banner. */
export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button type="button" onClick={openConsentSettings} className={className}>
      Cookie settings
    </button>
  );
}
