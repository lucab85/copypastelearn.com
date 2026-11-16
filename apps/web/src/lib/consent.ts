/**
 * Cookie consent state (first-party, no third-party consent service).
 *
 * The visitor's choice lives in the `cpl_consent` cookie for 180 days.
 * Two optional categories:
 *   - analytics: Google Analytics cookies, Microsoft Clarity
 *   - marketing: ad tags (Google Ads, Meta, LinkedIn, Reddit) and ad click ids
 *
 * Google Consent Mode v2 defaults to "denied" for everything (set inline in
 * the root layout before the GA config). `applyGoogleConsent` sends the
 * `update` command when a choice is known.
 */

export interface ConsentChoice {
  analytics: boolean;
  marketing: boolean;
}

export interface ConsentState extends ConsentChoice {
  /** Schema version of the stored value. */
  v: 1;
  /** When the choice was made (ms since epoch). */
  ts: number;
}

export const CONSENT_COOKIE = "cpl_consent";
const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // 180 days

/** Fired on `window` after the visitor saves a choice (detail: ConsentState). */
export const CONSENT_CHANGE_EVENT = "cpl:consent-change";
/** Fired on `window` to reopen the consent banner (footer "Cookie settings"). */
export const CONSENT_OPEN_EVENT = "cpl:consent-open";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const prefix = `${name}=`;
  for (const part of document.cookie.split(";")) {
    const c = part.trim();
    if (c.startsWith(prefix)) return decodeURIComponent(c.slice(prefix.length));
  }
  return undefined;
}

function secureFlag(): string {
  return typeof location !== "undefined" && location.protocol === "https:"
    ? "; Secure"
    : "";
}

/** The stored choice, or null if the visitor has not chosen yet. */
export function readConsent(): ConsentState | null {
  const raw = readCookie(CONSENT_COOKIE);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      parsed.v === 1 &&
      typeof parsed.analytics === "boolean" &&
      typeof parsed.marketing === "boolean"
    ) {
      return parsed as ConsentState;
    }
  } catch {
    // Malformed value: treat as "no choice yet".
  }
  return null;
}

export function hasAnalyticsConsent(): boolean {
  return readConsent()?.analytics === true;
}

export function hasMarketingConsent(): boolean {
  return readConsent()?.marketing === true;
}

/** Send the Consent Mode v2 `update` command for a choice. */
export function applyGoogleConsent(choice: ConsentChoice) {
  if (typeof window === "undefined" || !window.gtag) return;
  const ads = choice.marketing ? "granted" : "denied";
  window.gtag("consent", "update", {
    analytics_storage: choice.analytics ? "granted" : "denied",
    ad_storage: ads,
    ad_user_data: ads,
    ad_personalization: ads,
  });
}

/**
 * First-party cookies the analytics and ad tags set on our domain. Removed
 * when the visitor withdraws consent for the matching category.
 */
const ANALYTICS_COOKIE_PREFIXES = ["_ga", "_gid", "_gat", "_clck", "_clsk"];
const MARKETING_COOKIE_PREFIXES = ["_gcl_", "_fbp", "_fbc", "_rdt_", "li_fat_id", "_uetsid", "_uetvid"];

function deleteCookiesWithPrefixes(prefixes: string[]) {
  const names = document.cookie
    .split(";")
    .map((c) => c.trim().split("=")[0])
    .filter((n) => prefixes.some((p) => n.startsWith(p)));
  const host = location.hostname;
  // Tags set cookies on the registrable domain (".copypastelearn.com").
  const domains = [host, `.${host}`, `.${host.split(".").slice(-2).join(".")}`];
  for (const name of names) {
    document.cookie = `${name}=; Max-Age=0; Path=/`;
    for (const d of domains) {
      document.cookie = `${name}=; Max-Age=0; Path=/; Domain=${d}`;
    }
  }
}

/**
 * Store the visitor's choice, update Google Consent Mode and notify
 * listeners. If consent for a category is withdrawn, its cookies are
 * removed and the page reloads so already-loaded tags stop running.
 */
export function saveConsent(choice: ConsentChoice) {
  const previous = readConsent();
  const state: ConsentState = { v: 1, ts: Date.now(), ...choice };
  document.cookie =
    `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(state))}` +
    `; Max-Age=${CONSENT_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secureFlag()}`;

  applyGoogleConsent(choice);

  const withdrewAnalytics = previous?.analytics === true && !choice.analytics;
  const withdrewMarketing = previous?.marketing === true && !choice.marketing;
  if (withdrewAnalytics) deleteCookiesWithPrefixes(ANALYTICS_COOKIE_PREFIXES);
  if (withdrewMarketing) deleteCookiesWithPrefixes(MARKETING_COOKIE_PREFIXES);

  window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: state }));

  if (withdrewAnalytics || withdrewMarketing) {
    // Scripts that already run cannot be unloaded; a reload drops them.
    window.location.reload();
  }
}

/** Subscribe to consent changes. Returns an unsubscribe function. */
export function onConsentChange(cb: (state: ConsentState) => void): () => void {
  const handler = (e: Event) => cb((e as CustomEvent<ConsentState>).detail);
  window.addEventListener(CONSENT_CHANGE_EVENT, handler);
  return () => window.removeEventListener(CONSENT_CHANGE_EVENT, handler);
}

/** Reopen the consent banner (used by the footer "Cookie settings" link). */
export function openConsentSettings() {
  window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
}

/**
 * Inline script for the root layout. Runs before any Google tag command:
 * sets the Consent Mode v2 defaults to denied, re-applies a stored choice
 * for returning visitors, then queues the GA4 config.
 */
export function consentBootstrapScript(gaId: string): string {
  return `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  wait_for_update: 500
});
gtag('set', 'ads_data_redaction', true);
try {
  var m = document.cookie.match(/(?:^|; )${CONSENT_COOKIE}=([^;]*)/);
  if (m) {
    var c = JSON.parse(decodeURIComponent(m[1]));
    if (c && c.v === 1) {
      var ads = c.marketing ? 'granted' : 'denied';
      gtag('consent', 'update', {
        analytics_storage: c.analytics ? 'granted' : 'denied',
        ad_storage: ads,
        ad_user_data: ads,
        ad_personalization: ads
      });
    }
  }
} catch (e) {}
gtag('js', new Date());
gtag('config', '${gaId}');
`;
}
