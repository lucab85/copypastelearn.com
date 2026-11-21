/**
 * Google Analytics (gtag) helper utilities.
 *
 * Usage:
 *   import { trackEvent } from "@/lib/analytics";
 *   trackEvent("begin_checkout", { currency: "EUR", value: 29 });
 */

import { SUBSCRIPTION_PRICE_EUR } from "@copypastelearn/shared";
import { adsBeginCheckout, adsLead, adsPurchase, adsSignUp } from "@/lib/ads";

export const GA_ID = "G-YN94VH0TPN";

/**
 * Fallback purchase value when the real order amount is not known
 * (the monthly subscription price).
 */
export const DEFAULT_PURCHASE_VALUE = SUBSCRIPTION_PRICE_EUR;
export const DEFAULT_CURRENCY = "EUR";

// ─── Low-level gtag wrapper ────────────────────────────

type GtagParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/** Fire a GA4 event. No-ops if gtag hasn't loaded yet. */
export function trackEvent(eventName: string, params?: GtagParams) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, params);
  }
}

/** Update the GA page_path on SPA navigation (called from RouteChangeTracker). */
export function trackPageView(url: string) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("config", GA_ID, { page_path: url });
  }
}

// ─── Pre-defined event helpers ─────────────────────────

// --- Navigation / CTA ---
export function trackCtaClick(ctaText: string, location: string, destination?: string) {
  trackEvent("cta_click", { cta_text: ctaText, cta_location: location, destination });
}

// --- Auth ---
/** Account created. Also fires the ad platforms' sign-up conversions. */
export function trackSignUp(method = "clerk") {
  trackEvent("sign_up", { method });
  adsSignUp();
}

export function trackSignUpStart() {
  trackEvent("sign_up_start");
}

export function trackSignInStart() {
  trackEvent("sign_in_start");
}

// --- Newsletter ---
/** Newsletter sign-up. Also fires the ad platforms' lead conversions. */
export function trackNewsletterSignup(method: string, formId?: string) {
  trackEvent("newsletter_subscribe", { method, form_id: formId });
  adsLead();
}

// --- Ecommerce ---
export function trackBeginCheckout(currency = DEFAULT_CURRENCY, value = DEFAULT_PURCHASE_VALUE) {
  trackEvent("begin_checkout", { currency, value });
  adsBeginCheckout({ currency, value });
}

/**
 * Purchase completed. Pass the real order amount (major units, e.g. 29.0)
 * and ISO currency; the defaults are only a fallback when the order
 * cannot be looked up. Also fires the ad platforms' purchase conversions.
 */
export function trackPurchase(
  transactionId?: string,
  currency = DEFAULT_CURRENCY,
  value = DEFAULT_PURCHASE_VALUE,
) {
  trackEvent("purchase", { transaction_id: transactionId, currency, value });
  adsPurchase({ transactionId, currency, value });
}

const TRACKED_PURCHASES_KEY = "cpl_tracked_purchases";

/**
 * Like trackPurchase, but fires at most once per transaction id in this
 * browser (the success page can be reloaded or revisited).
 */
export function trackPurchaseOnce(transactionId: string, currency: string, value: number) {
  if (typeof window === "undefined") return;
  let seen: string[] = [];
  try {
    seen = JSON.parse(localStorage.getItem(TRACKED_PURCHASES_KEY) ?? "[]");
    if (!Array.isArray(seen)) seen = [];
  } catch {
    seen = [];
  }
  if (seen.includes(transactionId)) return;
  trackPurchase(transactionId, currency, value);
  try {
    localStorage.setItem(
      TRACKED_PURCHASES_KEY,
      JSON.stringify([...seen, transactionId].slice(-20)),
    );
  } catch {
    // Storage full or blocked: the event was still sent once.
  }
}

// --- Course & Lesson ---
export function trackViewCourse(courseSlug: string, courseTitle?: string) {
  trackEvent("view_course", { course_slug: courseSlug, course_title: courseTitle });
}

export function trackViewLesson(courseSlug: string, lessonSlug: string, lessonTitle?: string) {
  trackEvent("view_lesson", { course_slug: courseSlug, lesson_slug: lessonSlug, lesson_title: lessonTitle });
}

export function trackVideoStart(courseSlug: string, lessonSlug: string) {
  trackEvent("video_start", { course_slug: courseSlug, lesson_slug: lessonSlug });
}

export function trackVideoProgress(courseSlug: string, lessonSlug: string, percent: number) {
  trackEvent("video_progress", { course_slug: courseSlug, lesson_slug: lessonSlug, percent });
}

export function trackVideoComplete(courseSlug: string, lessonSlug: string) {
  trackEvent("video_complete", { course_slug: courseSlug, lesson_slug: lessonSlug });
}

export function trackLessonComplete(courseSlug: string, lessonSlug: string, percentComplete?: number) {
  trackEvent("lesson_complete", { course_slug: courseSlug, lesson_slug: lessonSlug, percent_complete: percentComplete });
}

export function trackCourseComplete(courseSlug: string) {
  trackEvent("course_complete", { course_slug: courseSlug });
}

// --- Code & Content ---
export function trackCodeCopy(label: string, language: string) {
  trackEvent("code_copy", { snippet_label: label, language });
}

export function trackTranscriptToggle(action: "open" | "close") {
  trackEvent("transcript_toggle", { action });
}

// --- Labs ---
export function trackLabStart(labDefinitionId: string) {
  trackEvent("lab_start", { lab_definition_id: labDefinitionId });
}

export function trackLabReady(sessionId: string) {
  trackEvent("lab_ready", { session_id: sessionId });
}

export function trackLabValidateStep(sessionId: string, stepIndex: number) {
  trackEvent("lab_validate_step", { session_id: sessionId, step_index: stepIndex });
}

export function trackLabStepPass(sessionId: string, stepIndex: number) {
  trackEvent("lab_step_pass", { session_id: sessionId, step_index: stepIndex });
}

export function trackLabStepFail(sessionId: string, stepIndex: number) {
  trackEvent("lab_step_fail", { session_id: sessionId, step_index: stepIndex });
}

export function trackLabComplete(sessionId: string) {
  trackEvent("lab_complete", { session_id: sessionId });
}

export function trackLabDestroy(sessionId: string) {
  trackEvent("lab_destroy", { session_id: sessionId });
}

// --- Paywall ---
export function trackPaywallView(location: string, params?: GtagParams) {
  trackEvent("paywall_view", { location, ...params });
}
