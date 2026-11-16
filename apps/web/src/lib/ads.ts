/**
 * Ad platform tags and conversion events.
 *
 * Every tag is opt-in twice: it loads only after the visitor grants
 * marketing consent, and only if its public env var is set at build time.
 * With no env vars set, everything here is a no-op.
 *
 *   NEXT_PUBLIC_GOOGLE_ADS_ID                 AW-XXXXXXXXXX
 *   NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL     conversion label (optional)
 *   NEXT_PUBLIC_GOOGLE_ADS_SIGNUP_LABEL       conversion label (optional)
 *   NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL         conversion label (optional)
 *   NEXT_PUBLIC_META_PIXEL_ID                 Meta (Facebook) Pixel id
 *   NEXT_PUBLIC_LINKEDIN_PARTNER_ID           LinkedIn Insight Tag partner id
 *   NEXT_PUBLIC_LINKEDIN_PURCHASE_CONVERSION_ID  (optional)
 *   NEXT_PUBLIC_LINKEDIN_SIGNUP_CONVERSION_ID    (optional)
 *   NEXT_PUBLIC_LINKEDIN_LEAD_CONVERSION_ID      (optional)
 *   NEXT_PUBLIC_REDDIT_PIXEL_ID               Reddit Pixel id
 *
 * The callers are the helpers in `@/lib/analytics` (trackPurchase,
 * trackBeginCheckout, trackSignUp, trackNewsletterSignup), so each GA4
 * ecommerce event also reaches the ad platforms that are configured.
 */

import { hasMarketingConsent } from "@/lib/consent";

// `process.env.NEXT_PUBLIC_*` must be referenced literally so Next.js
// inlines the values into the client bundle.
const clean = (v: string | undefined) => (v && v.trim() ? v.trim() : undefined);

export const ADS_CONFIG = {
  googleAdsId: clean(process.env.NEXT_PUBLIC_GOOGLE_ADS_ID),
  googleAdsPurchaseLabel: clean(process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL),
  googleAdsSignupLabel: clean(process.env.NEXT_PUBLIC_GOOGLE_ADS_SIGNUP_LABEL),
  googleAdsLeadLabel: clean(process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL),
  metaPixelId: clean(process.env.NEXT_PUBLIC_META_PIXEL_ID),
  linkedinPartnerId: clean(process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID),
  linkedinPurchaseConversionId: clean(process.env.NEXT_PUBLIC_LINKEDIN_PURCHASE_CONVERSION_ID),
  linkedinSignupConversionId: clean(process.env.NEXT_PUBLIC_LINKEDIN_SIGNUP_CONVERSION_ID),
  linkedinLeadConversionId: clean(process.env.NEXT_PUBLIC_LINKEDIN_LEAD_CONVERSION_ID),
  redditPixelId: clean(process.env.NEXT_PUBLIC_REDDIT_PIXEL_ID),
} as const;

/** True if at least one ad platform is configured. */
export const ADS_ENABLED = Boolean(
  ADS_CONFIG.googleAdsId ||
    ADS_CONFIG.metaPixelId ||
    ADS_CONFIG.linkedinPartnerId ||
    ADS_CONFIG.redditPixelId,
);

type Fn = (...args: unknown[]) => void;

/** Command-queue stub shape used by the vendors' official snippets. */
type Queue = Fn & {
  q?: unknown[];
  queue?: unknown[];
  callQueue?: unknown[];
  push?: unknown;
  loaded?: boolean;
  version?: string;
  callMethod?: Fn;
  sendEvent?: Fn;
};

interface AdsWindow {
  gtag?: (...args: unknown[]) => void;
  fbq?: Queue;
  _fbq?: Queue;
  lintrk?: Queue;
  rdt?: Queue;
  _linkedin_partner_id?: string;
  _linkedin_data_partner_ids?: string[];
}

function w(): AdsWindow {
  return window as unknown as AdsWindow;
}

let loaded = false;

function injectScript(src: string) {
  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

function loadGoogleAds(id: string) {
  // gtag.js is already on the page for GA4; a second config adds the Ads
  // destination. Consent Mode (ad_storage) was granted before this runs.
  w().gtag?.("config", id);
}

function loadMeta(id: string) {
  const win = w();
  if (!win.fbq) {
    const fbq: Queue = function (...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod.apply(fbq, args);
      else fbq.queue!.push(args);
    };
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
    win.fbq = fbq;
    win._fbq = win._fbq ?? fbq;
    injectScript("https://connect.facebook.net/en_US/fbevents.js");
  }
  win.fbq!("init", id);
  win.fbq!("track", "PageView");
}

function loadLinkedIn(partnerId: string) {
  const win = w();
  win._linkedin_partner_id = partnerId;
  win._linkedin_data_partner_ids = win._linkedin_data_partner_ids ?? [];
  win._linkedin_data_partner_ids.push(partnerId);
  if (!win.lintrk) {
    const lintrk: Queue = function (a: unknown, b: unknown) {
      lintrk.q!.push([a, b]);
    } as Queue;
    lintrk.q = [];
    win.lintrk = lintrk;
  }
  injectScript("https://snap.licdn.com/li.lms-analytics/insight.min.js");
}

function loadReddit(id: string) {
  const win = w();
  if (!win.rdt) {
    const rdt: Queue = function (...args: unknown[]) {
      if (rdt.sendEvent) rdt.sendEvent.apply(rdt, args);
      else rdt.callQueue!.push(args);
    };
    rdt.callQueue = [];
    win.rdt = rdt;
    injectScript("https://www.redditstatic.com/ads/pixel.js");
  }
  win.rdt!("init", id);
  win.rdt!("track", "PageVisit");
}

/**
 * Load every configured ad tag. Idempotent; does nothing without
 * marketing consent. Called by <MarketingTags /> on mount and when the
 * visitor accepts marketing cookies.
 */
export function loadAdTags() {
  if (loaded || typeof window === "undefined" || !ADS_ENABLED) return;
  if (!hasMarketingConsent()) return;
  loaded = true;
  if (ADS_CONFIG.googleAdsId) loadGoogleAds(ADS_CONFIG.googleAdsId);
  if (ADS_CONFIG.metaPixelId) loadMeta(ADS_CONFIG.metaPixelId);
  if (ADS_CONFIG.linkedinPartnerId) loadLinkedIn(ADS_CONFIG.linkedinPartnerId);
  if (ADS_CONFIG.redditPixelId) loadReddit(ADS_CONFIG.redditPixelId);
}

/** True when ad tags are loaded (marketing consent + at least one id). */
function ready(): boolean {
  return loaded && typeof window !== "undefined";
}

/** SPA navigation: page views for the pixels that do not track history. */
export function adsPageView() {
  if (!ready()) return;
  w().fbq?.("track", "PageView");
  w().rdt?.("track", "PageVisit");
}

function googleAdsConversion(label: string | undefined, params: Record<string, unknown> = {}) {
  if (!ADS_CONFIG.googleAdsId || !label) return;
  w().gtag?.("event", "conversion", {
    send_to: `${ADS_CONFIG.googleAdsId}/${label}`,
    ...params,
  });
}

function linkedinConversion(conversionId: string | undefined) {
  if (!ADS_CONFIG.linkedinPartnerId || !conversionId) return;
  w().lintrk?.("track", { conversion_id: Number(conversionId) });
}

export interface AdsPurchase {
  transactionId?: string;
  value?: number;
  currency?: string;
}

export function adsPurchase({ transactionId, value, currency }: AdsPurchase) {
  if (!ready()) return;
  googleAdsConversion(ADS_CONFIG.googleAdsPurchaseLabel, {
    value,
    currency,
    transaction_id: transactionId ?? "",
  });
  // eventID lets Meta deduplicate against a future server-side event.
  if (transactionId) {
    w().fbq?.("track", "Purchase", { value, currency }, { eventID: transactionId });
  } else {
    w().fbq?.("track", "Purchase", { value, currency });
  }
  linkedinConversion(ADS_CONFIG.linkedinPurchaseConversionId);
  w().rdt?.("track", "Purchase", {
    value,
    currency,
    itemCount: 1,
    ...(transactionId ? { conversionId: transactionId } : {}),
  });
}

export function adsBeginCheckout({ value, currency }: { value?: number; currency?: string } = {}) {
  if (!ready()) return;
  w().fbq?.("track", "InitiateCheckout", { value, currency });
}

export function adsSignUp() {
  if (!ready()) return;
  googleAdsConversion(ADS_CONFIG.googleAdsSignupLabel);
  w().fbq?.("track", "CompleteRegistration");
  linkedinConversion(ADS_CONFIG.linkedinSignupConversionId);
  w().rdt?.("track", "SignUp");
}

export function adsLead() {
  if (!ready()) return;
  googleAdsConversion(ADS_CONFIG.googleAdsLeadLabel);
  w().fbq?.("track", "Lead");
  linkedinConversion(ADS_CONFIG.linkedinLeadConversionId);
  w().rdt?.("track", "Lead");
}
