/**
 * Google Analytics (gtag) helper utilities.
 *
 * Usage:
 *   import { trackEvent } from "@/lib/analytics";
 *   trackEvent("begin_checkout", { currency: "EUR", value: 29 });
 */

export const GA_ID = "G-YN94VH0TPN";

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
export function trackSignUpStart() {
  trackEvent("sign_up_start");
}

export function trackSignInStart() {
  trackEvent("sign_in_start");
}

// --- Ecommerce ---
export function trackBeginCheckout(currency = "EUR", value = 29) {
  trackEvent("begin_checkout", { currency, value });
}

export function trackPurchase(transactionId?: string, currency = "EUR", value = 29) {
  trackEvent("purchase", { transaction_id: transactionId, currency, value });
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
export function trackPaywallView(location: string) {
  trackEvent("paywall_view", { location });
}
