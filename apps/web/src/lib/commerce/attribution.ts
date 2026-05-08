import type { NextRequest } from "next/server";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

/**
 * First-party attribution capture (FR-018, FR-012, SC-009).
 *
 * The `cpl_attr` cookie carries the buyer's last-touch UTM and
 * referrer for 24h, SameSite=Lax. UTM query params on the current
 * request override the cookie for the duration of that request.
 */

export interface Attribution {
  sourceDomain?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  channel?: string; // "storefront" | "agent" | "chat"
}

const COOKIE_NAME = "cpl_attr";
const COOKIE_TTL_SECONDS = 60 * 60 * 24; // 24h

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
  };

  const cookieRaw = req.cookies.get(COOKIE_NAME)?.value;
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
    name: COOKIE_NAME,
    value: JSON.stringify(attr),
    options: {
      maxAge: COOKIE_TTL_SECONDS,
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
  const raw = cookies.get(COOKIE_NAME)?.value;
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
