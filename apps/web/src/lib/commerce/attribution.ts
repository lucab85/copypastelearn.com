import type { NextRequest } from "next/server";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

/**
 * First-party attribution capture (FR-018, FR-012, SC-009).
 *
 * The `cpl_attr` cookie carries the buyer's last-touch UTM and
 * referrer for 30 days, SameSite=Lax. UTM query params on the current
 * request override the cookie for the duration of that request.
 *
 * The cookie is written in the browser by <AttributionCapture /> when a
 * visitor lands with UTM or ad click-id parameters. Ad click ids (gclid,
 * fbclid, li_fat_id, rdt_cid) are kept only with marketing consent. They
 * travel in the Stripe Checkout Session metadata and the AnalyticsEvent
 * JSON metadata; the Order table keeps its existing UTM columns only.
 */

export interface Attribution {
  sourceDomain?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  channel?: string; // "storefront" | "agent" | "chat"
  /** Google Ads click id. */
  gclid?: string;
  /** Meta (Facebook) click id. */
  fbclid?: string;
  /** LinkedIn click id. */
  liFatId?: string;
  /** Reddit click id. */
  rdtCid?: string;
}

export const ATTRIBUTION_COOKIE = "cpl_attr";
export const ATTRIBUTION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

/** Campaign query params (stored without marketing consent: no identifiers). */
export const UTM_PARAMS = {
  utm_source: "utmSource",
  utm_medium: "utmMedium",
  utm_campaign: "utmCampaign",
  utm_content: "utmContent",
} as const satisfies Record<string, keyof Attribution>;

/** Ad click-id query params (stored only with marketing consent). */
export const CLICK_ID_PARAMS = {
  gclid: "gclid",
  fbclid: "fbclid",
  li_fat_id: "liFatId",
  rdt_cid: "rdtCid",
} as const satisfies Record<string, keyof Attribution>;

/** Stripe metadata values are capped at 500 characters. */
const MAX_METADATA_VALUE = 500;

/**
 * Stripe Checkout Session metadata for an attribution. `fulfill.ts`
 * copies the UTM keys onto the Order; click ids stay in Stripe metadata.
 */
export function attributionToStripeMetadata(attr: Attribution): Record<string, string> {
  const entries: [string, string | undefined][] = [
    ["source_domain", attr.sourceDomain],
    ["utm_source", attr.utmSource],
    ["utm_medium", attr.utmMedium],
    ["utm_campaign", attr.utmCampaign],
    ["utm_content", attr.utmContent],
    ["channel", attr.channel],
    ["gclid", attr.gclid],
    ["fbclid", attr.fbclid],
    ["li_fat_id", attr.liFatId],
    ["rdt_cid", attr.rdtCid],
  ];
  const out: Record<string, string> = {};
  for (const [k, v] of entries) {
    if (v) out[k] = v.slice(0, MAX_METADATA_VALUE);
  }
  return out;
}

/** Click ids only, for the AnalyticsEvent JSON metadata. */
export function clickIds(attr: Attribution): Partial<Attribution> {
  const out: Partial<Attribution> = {};
  for (const key of Object.values(CLICK_ID_PARAMS)) {
    if (attr[key]) out[key] = attr[key];
  }
  return out;
}

function safeHostname(url: string): string | undefined {
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}

/**
 * Parse attribution from a request: query params take precedence,
 * then the `cpl_attr` cookie, then the `referer` header hostname.
 */
export function parseAttributionFromRequest(req: NextRequest): Attribution {
  const url = new URL(req.url);
  const sp = url.searchParams;

  const fromQuery: Attribution = {
    utmSource: sp.get("utm_source") ?? undefined,
    utmMedium: sp.get("utm_medium") ?? undefined,
    utmCampaign: sp.get("utm_campaign") ?? undefined,
    utmContent: sp.get("utm_content") ?? undefined,
    sourceDomain: sp.get("source_domain") ?? undefined,
    gclid: sp.get("gclid") ?? undefined,
    fbclid: sp.get("fbclid") ?? undefined,
    liFatId: sp.get("li_fat_id") ?? undefined,
    rdtCid: sp.get("rdt_cid") ?? undefined,
  };

  const cookieRaw = req.cookies.get(ATTRIBUTION_COOKIE)?.value;
  const fromCookie = cookieRaw ? safeJson(cookieRaw) : undefined;
  const fromReferer = safeHostname(req.headers.get("referer") ?? "");

  return {
    sourceDomain:
      fromQuery.sourceDomain ?? fromCookie?.sourceDomain ?? fromReferer,
    utmSource: fromQuery.utmSource ?? fromCookie?.utmSource,
    utmMedium: fromQuery.utmMedium ?? fromCookie?.utmMedium,
    utmCampaign: fromQuery.utmCampaign ?? fromCookie?.utmCampaign,
    utmContent: fromQuery.utmContent ?? fromCookie?.utmContent,
    channel: fromCookie?.channel ?? "storefront",
    gclid: fromQuery.gclid ?? fromCookie?.gclid,
    fbclid: fromQuery.fbclid ?? fromCookie?.fbclid,
    liFatId: fromQuery.liFatId ?? fromCookie?.liFatId,
    rdtCid: fromQuery.rdtCid ?? fromCookie?.rdtCid,
  };
}

/** Serialize attribution into a Set-Cookie header value. */
export function buildAttributionCookie(attr: Attribution): {
  name: string;
  value: string;
  options: {
    maxAge: number;
    httpOnly: false;
    sameSite: "lax";
    secure: boolean;
    path: "/";
  };
} {
  return {
    name: ATTRIBUTION_COOKIE,
    value: JSON.stringify(attr),
    options: {
      maxAge: ATTRIBUTION_TTL_SECONDS,
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    },
  };
}

/** Read attribution from server-component cookies(). */
export function parseAttributionFromCookieStore(
  cookies: ReadonlyRequestCookies,
): Attribution {
  const raw = cookies.get(ATTRIBUTION_COOKIE)?.value;
  return raw ? (safeJson(raw) ?? {}) : {};
}

function safeJson(s: string): Attribution | undefined {
  try {
    const parsed = JSON.parse(s);
    if (parsed && typeof parsed === "object") return parsed as Attribution;
    return undefined;
  } catch {
    return undefined;
  }
}
