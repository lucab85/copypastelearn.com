import { describe, expect, it } from "vitest";
import { proPitch } from "../../src/lib/pro-pitch";
import { authUrl, isLessonPath, lessonPath, parseResumeLesson } from "../../src/lib/resume-lesson";
import { newsletterPopupAllowed, newsletterPopupDelay } from "../../src/lib/newsletter-popup";

const plan = { id: "plan_1", name: "Pro", currencySymbol: "$", monthlyCents: 2900, annualCents: 30000 };

describe("pro pitch", () => {
  it("states both prices", () => {
    expect(proPitch(plan, false)).toEqual({
      price: "$25 a month billed yearly, or $29 month to month",
      offer: null,
    });
  });
  it("adds the launch amounts while the offer runs", () => {
    expect(proPitch(plan, true).offer).toBe(
      "Until 30 November: $210 for the first year, or $14.50 for the first month, with code LAUNCH.",
    );
  });
  it("copes with a plan that has no annual price", () => {
    expect(proPitch({ ...plan, annualCents: null }, true)).toEqual({
      price: "$29 a month",
      offer: "Until 30 November: $14.50 for the first month with code LAUNCH.",
    });
  });
});

describe("resume lesson", () => {
  const path = lessonPath("mcp-for-kubernetes", "what-is-mcp");
  const now = Date.parse("2026-11-21T10:00:00Z");
  const stored = (value: object) => JSON.stringify(value);

  it("builds lesson paths and the auth pages that return to them", () => {
    expect(path).toBe("/courses/mcp-for-kubernetes/lessons/what-is-mcp");
    expect(authUrl("/sign-up", path)).toBe(
      "/sign-up?redirect_url=%2Fcourses%2Fmcp-for-kubernetes%2Flessons%2Fwhat-is-mcp",
    );
  });
  it("accepts only lesson pages of this site", () => {
    expect(isLessonPath(path)).toBe(true);
    for (const bad of ["https://evil.example/courses/a/lessons/b", "//evil.example", "/pricing", "/courses/a/lessons/b?x=1", 7, null]) {
      expect(isLessonPath(bad)).toBe(false);
    }
  });
  it("reads back a lesson stored in the last week", () => {
    expect(parseResumeLesson(stored({ path, title: "What is MCP", at: now - 3_600_000 }), now)).toEqual({
      path,
      title: "What is MCP",
    });
  });
  it("ignores old, future, foreign and broken values", () => {
    expect(parseResumeLesson(stored({ path, title: "t", at: now - 8 * 86_400_000 }), now)).toBeNull();
    expect(parseResumeLesson(stored({ path, title: "t", at: now + 1000 }), now)).toBeNull();
    expect(parseResumeLesson(stored({ path: "https://evil.example/", title: "t", at: now }), now)).toBeNull();
    expect(parseResumeLesson("{not json", now)).toBeNull();
    expect(parseResumeLesson(null, now)).toBeNull();
  });
});

describe("newsletter popup", () => {
  it("stays closed on lessons and on the way to paying", () => {
    for (const path of [
      "/courses/mcp-for-kubernetes/lessons/what-is-mcp",
      "/pricing",
      "/sign-up",
      "/sign-up/verify-email-address",
      "/sign-in",
      "/checkout/success",
      "/dashboard",
      "/settings",
    ]) {
      expect(newsletterPopupAllowed(path)).toBe(false);
    }
    expect(newsletterPopupAllowed(null)).toBe(false);
  });
  it("can open elsewhere", () => {
    for (const path of ["/", "/courses", "/courses/mcp-for-kubernetes", "/blog/some-post", "/academy", "/pricing-guide"]) {
      expect(newsletterPopupAllowed(path)).toBe(true);
    }
  });
  it("waits 30 seconds on the site and at least 5 on the page", () => {
    expect(newsletterPopupDelay(0, 30_000, 5_000)).toBe(30_000);
    expect(newsletterPopupDelay(12_000, 30_000, 5_000)).toBe(18_000);
    expect(newsletterPopupDelay(90_000, 30_000, 5_000)).toBe(5_000);
  });
});
