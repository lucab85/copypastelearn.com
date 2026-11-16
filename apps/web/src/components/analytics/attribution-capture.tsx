"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  ATTRIBUTION_COOKIE,
  ATTRIBUTION_TTL_SECONDS,
  CLICK_ID_PARAMS,
  UTM_PARAMS,
  type Attribution,
} from "@/lib/commerce/attribution";
import { hasMarketingConsent, onConsentChange } from "@/lib/consent";

/**
 * Click ids seen on landing but not stored yet because the visitor had not
 * granted marketing consent. Kept in memory only, so they survive client-side
 * navigation until the visitor answers the banner, and are gone on reload.
 */
let pendingClickIds: Partial<Attribution> = {};

function readAttr(): Attribution {
  const prefix = `${ATTRIBUTION_COOKIE}=`;
  for (const part of document.cookie.split(";")) {
    const c = part.trim();
    if (!c.startsWith(prefix)) continue;
    try {
      const parsed = JSON.parse(decodeURIComponent(c.slice(prefix.length)));
      return parsed && typeof parsed === "object" ? (parsed as Attribution) : {};
    } catch {
      return {};
    }
  }
  return {};
}

function writeAttr(attr: Attribution) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie =
    `${ATTRIBUTION_COOKIE}=${encodeURIComponent(JSON.stringify(attr))}` +
    `; Max-Age=${ATTRIBUTION_TTL_SECONDS}; Path=/; SameSite=Lax${secure}`;
}

function externalReferrerHost(): string | undefined {
  try {
    const host = new URL(document.referrer).hostname;
    return host && host !== location.hostname ? host : undefined;
  } catch {
    return undefined;
  }
}

function pick<K extends string>(
  sp: URLSearchParams,
  map: Record<K, keyof Attribution>,
): Partial<Attribution> {
  const out: Partial<Attribution> = {};
  for (const [param, key] of Object.entries(map) as [K, keyof Attribution][]) {
    const v = sp.get(param);
    if (v) out[key] = v.slice(0, 500);
  }
  return out;
}

/**
 * Writes the first-party `cpl_attr` cookie (30 days) when a visitor lands
 * with campaign parameters. The checkout API reads it and passes it to
 * Stripe metadata and the Order.
 *
 * - utm_* and source_domain: always stored (campaign names, no identifier).
 *   A new set of UTM params replaces the previous set (last touch).
 * - gclid / fbclid / li_fat_id / rdt_cid: stored only with marketing
 *   consent; removed from the cookie when that consent is withdrawn.
 *
 * Must be rendered inside a <Suspense> boundary (useSearchParams).
 */
export function AttributionCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const sp = new URLSearchParams(searchParams?.toString() ?? "");
    const utm = pick(sp, UTM_PARAMS);
    const clicks = pick(sp, CLICK_ID_PARAMS);
    const hasUtm = Object.keys(utm).length > 0;
    const hasClicks = Object.keys(clicks).length > 0;
    const explicitSource = sp.get("source_domain") ?? sp.get("src") ?? undefined;
    if (!hasUtm && !hasClicks && !explicitSource) return;

    const next: Attribution = { ...readAttr() };
    if (hasUtm) {
      for (const key of Object.values(UTM_PARAMS)) delete next[key];
      Object.assign(next, utm);
    }
    const sourceDomain = explicitSource ?? externalReferrerHost();
    if (sourceDomain) next.sourceDomain = sourceDomain.slice(0, 255);

    if (hasClicks) {
      if (hasMarketingConsent()) Object.assign(next, clicks);
      else pendingClickIds = { ...pendingClickIds, ...clicks };
    }
    writeAttr(next);
  }, [searchParams]);

  useEffect(
    () =>
      onConsentChange((state) => {
        const current = readAttr();
        if (state.marketing) {
          if (Object.keys(pendingClickIds).length === 0) return;
          writeAttr({ ...current, ...pendingClickIds });
          pendingClickIds = {};
          return;
        }
        pendingClickIds = {};
        const keys = Object.values(CLICK_ID_PARAMS);
        if (!keys.some((k) => current[k])) return;
        for (const k of keys) delete current[k];
        writeAttr(current);
      }),
    [],
  );

  return null;
}
