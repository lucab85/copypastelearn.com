import { describe, expect, it } from "vitest";
import { onboardingEmailConfig, onboardingLinkSecret } from "../../src/lib/onboarding-emails/config";
import { signUnsubscribe, unsubscribeUrl, verifyUnsubscribe } from "../../src/lib/onboarding-emails/links";
import {
  buildOnboardingEmail,
  GAP_DAYS,
  nextSendAfter,
  STEP_COUNT,
  type OnboardingContext,
} from "../../src/lib/onboarding-emails/sequence";

const SECRET = "0123456789abcdef0123456789abcdef";
const ENV = {
  ONBOARDING_EMAILS_ENABLED: "true",
  RESEND_API_KEY: "re_test",
  ONBOARDING_LINK_SECRET: SECRET,
  CRON_SECRET: "cron",
};

describe("onboarding email config", () => {
  it("is off unless the switch, the keys and the cron secret are all set", () => {
    expect(onboardingEmailConfig({})).toBeNull();
    for (const missing of Object.keys(ENV)) {
      expect(onboardingEmailConfig({ ...ENV, [missing]: undefined })).toBeNull();
    }
    expect(onboardingEmailConfig({ ...ENV, ONBOARDING_EMAILS_ENABLED: "1" })).toBeNull();
    expect(onboardingEmailConfig(ENV)).not.toBeNull();
  });
  it("refuses a short link secret", () => {
    expect(onboardingEmailConfig({ ...ENV, ONBOARDING_LINK_SECRET: "short" })).toBeNull();
    expect(onboardingLinkSecret({ ONBOARDING_LINK_SECRET: "short" })).toBeNull();
  });
  it("keeps the link secret readable when the emails are switched off", () => {
    expect(onboardingLinkSecret({ ONBOARDING_LINK_SECRET: SECRET })).toBe(SECRET);
  });
  it("falls back to the support address for replies and strips the trailing slash", () => {
    const cfg = onboardingEmailConfig({
      ...ENV,
      COMMERCE_SUPPORT_EMAIL: "support@example.com",
      NEXT_PUBLIC_APP_URL: "https://example.com/",
    });
    expect(cfg?.replyTo).toBe("support@example.com");
    expect(cfg?.appUrl).toBe("https://example.com");
  });
});

describe("unsubscribe links", () => {
  it("accepts only the signature made for that sequence with that secret", () => {
    const sig = signUnsubscribe("seq1", SECRET);
    expect(verifyUnsubscribe("seq1", sig, SECRET)).toBe(true);
    expect(verifyUnsubscribe("seq2", sig, SECRET)).toBe(false);
    expect(verifyUnsubscribe("seq1", sig, SECRET.replace("0", "1"))).toBe(false);
    expect(verifyUnsubscribe("seq1", "", SECRET)).toBe(false);
    expect(verifyUnsubscribe("seq1", sig.slice(1), SECRET)).toBe(false);
  });
  it("builds a link that verifies", () => {
    const url = new URL(unsubscribeUrl("https://example.com", "seq1", SECRET));
    expect(url.pathname).toBe("/api/email/unsubscribe");
    expect(verifyUnsubscribe(url.searchParams.get("s")!, url.searchParams.get("sig")!, SECRET)).toBe(true);
  });
});

const base: OnboardingContext = {
  firstName: "Ada",
  appUrl: "https://example.com",
  next: null,
  lessonsCompleted: 0,
  isPro: false,
  price: "$25 a month billed yearly, or $29 month to month",
  offer: null,
  unsubscribeUrl: "https://example.com/api/email/unsubscribe?s=seq1&sig=x",
};
const next = { courseTitle: "Course A", lessonTitle: "Lesson 2", path: "/courses/a/lessons/two" };

describe("onboarding sequence", () => {
  it("spaces the four emails 2, 3 and 7 days apart and then stops", () => {
    const t0 = new Date("2026-11-21T10:00:00Z");
    expect(GAP_DAYS).toHaveLength(STEP_COUNT - 1);
    expect(nextSendAfter(0, t0)?.toISOString()).toBe("2026-11-23T10:00:00.000Z");
    expect(nextSendAfter(1, t0)?.toISOString()).toBe("2026-11-24T10:00:00.000Z");
    expect(nextSendAfter(2, t0)?.toISOString()).toBe("2026-11-28T10:00:00.000Z");
    expect(nextSendAfter(3, t0)).toBeNull();
  });

  it("puts the unsubscribe link in every email", () => {
    for (let step = 0; step < STEP_COUNT; step++) {
      const email = buildOnboardingEmail(step, base);
      expect(email?.text).toContain(`Stop these emails: ${base.unsubscribeUrl}`);
      expect(email?.subject).toBeTruthy();
    }
    expect(buildOnboardingEmail(STEP_COUNT, base)).toBeNull();
  });

  it("links the next lesson when a course is in progress, the catalog otherwise", () => {
    expect(buildOnboardingEmail(0, { ...base, next })?.text).toContain("https://example.com/courses/a/lessons/two");
    expect(buildOnboardingEmail(0, base)?.text).toContain("https://example.com/courses\n");
    expect(buildOnboardingEmail(1, { ...base, next, lessonsCompleted: 1 })?.subject).toBe("Next lesson: Lesson 2");
    expect(buildOnboardingEmail(1, { ...base, next, lessonsCompleted: 1 })?.text).toContain("finished 1 lesson so far");
    expect(buildOnboardingEmail(1, { ...base, lessonsCompleted: 3 })?.subject).toBe("Pick your next course");
    expect(buildOnboardingEmail(1, base)?.subject).toBe("One lesson to start");
  });

  it("never sends the Pro email to a Pro member, or without a price", () => {
    expect(buildOnboardingEmail(2, { ...base, isPro: true })).toBeNull();
    expect(buildOnboardingEmail(2, { ...base, price: null })).toBeNull();
  });

  it("states the price, and the offer only while it runs", () => {
    const plain = buildOnboardingEmail(2, base)!.text;
    expect(plain).toContain("Pro costs $25 a month billed yearly, or $29 month to month.");
    expect(plain).not.toContain("LAUNCH");
    const offer = "Until 30 November: $210 for the first year, or $14.50 for the first month, with code LAUNCH.";
    expect(buildOnboardingEmail(2, { ...base, offer })!.text).toContain(offer);
  });

  it("greets without a name, and appends the footer line when set", () => {
    const email = buildOnboardingEmail(3, { ...base, firstName: null, footer: "Example BV, Street 1, City" })!;
    expect(email.text.startsWith("Hi,\n")).toBe(true);
    expect(email.text.endsWith("Example BV, Street 1, City")).toBe(true);
  });
});
