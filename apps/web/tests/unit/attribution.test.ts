import { describe, it, expect, vi } from "vitest";
import type { NextRequest } from "next/server";
import {
  parseAttributionFromRequest,
  buildAttributionCookie,
} from "@/lib/commerce/attribution";

vi.mock("@/lib/db", () => ({ db: {} }));

function buildReq(opts: {
  url: string;
  cookie?: string;
  referer?: string;
}): NextRequest {
  const headers = new Headers();
  if (opts.referer) headers.set("referer", opts.referer);
  const cookies = new Map<string, { value: string }>();
  if (opts.cookie) cookies.set("cpl_attr", { value: opts.cookie });

  return {
    url: opts.url,
    headers: {
      get: (name: string) => headers.get(name),
    },
    cookies: {
      get: (name: string) => cookies.get(name),
    },
  } as unknown as NextRequest;
}

describe("attribution (FR-018, US3)", () => {
  it("captures all UTM params from query string", () => {
    const req = buildReq({
      url: "https://copypastelearn.com/products/x?utm_source=ansiblepilot.com&utm_campaign=cta-test&utm_content=article-id-123&utm_medium=referral",
    });

    const attr = parseAttributionFromRequest(req);
    expect(attr.utmSource).toBe("ansiblepilot.com");
    expect(attr.utmCampaign).toBe("cta-test");
    expect(attr.utmContent).toBe("article-id-123");
    expect(attr.utmMedium).toBe("referral");
  });

  it("query params override the cpl_attr cookie", () => {
    const req = buildReq({
      url: "https://copypastelearn.com/products/x?utm_source=newsletter",
      cookie: JSON.stringify({
        utmSource: "ansiblepilot.com",
        utmCampaign: "old",
      }),
    });

    const attr = parseAttributionFromRequest(req);
    expect(attr.utmSource).toBe("newsletter");
    // Cookie value preserved when query is silent on that key.
    expect(attr.utmCampaign).toBe("old");
  });

  it("falls back to referer hostname for sourceDomain when no cookie/query value", () => {
    const req = buildReq({
      url: "https://copypastelearn.com/products/x",
      referer: "https://www.ansiblepilot.com/some/article",
    });

    const attr = parseAttributionFromRequest(req);
    expect(attr.sourceDomain).toBe("www.ansiblepilot.com");
  });

  it("returns sane defaults when no signals present", () => {
    const req = buildReq({ url: "https://copypastelearn.com/" });
    const attr = parseAttributionFromRequest(req);
    expect(attr.utmSource).toBeUndefined();
    expect(attr.channel).toBe("storefront");
  });

  it("ignores malformed cookie payloads without throwing", () => {
    const req = buildReq({
      url: "https://copypastelearn.com/x",
      cookie: "{not-json",
    });
    expect(() => parseAttributionFromRequest(req)).not.toThrow();
  });

  it("buildAttributionCookie sets 24h SameSite=Lax", () => {
    const cookie = buildAttributionCookie({ utmSource: "newsletter" });
    expect(cookie.name).toBe("cpl_attr");
    expect(cookie.options.maxAge).toBe(60 * 60 * 24);
    expect(cookie.options.sameSite).toBe("lax");
    expect(cookie.options.path).toBe("/");
    expect(cookie.options.httpOnly).toBe(false);
  });
});
