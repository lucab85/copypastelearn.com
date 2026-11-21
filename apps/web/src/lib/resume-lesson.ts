/**
 * The lesson a visitor was stopped at, kept in this browser so the page shown
 * after sign-up or payment can send them back to it.
 */
export interface ResumeLesson {
  path: string;
  title: string;
}

const KEY = "cpl_resume_lesson";
const KEEP_MS = 7 * 86_400_000;

export function lessonPath(courseSlug: string, lessonSlug: string): string {
  return `/courses/${courseSlug}/lessons/${lessonSlug}`;
}

/** Only lesson pages of this site: the value comes back from storage. */
export function isLessonPath(path: unknown): path is string {
  return typeof path === "string" && /^\/courses\/[a-z0-9-]+\/lessons\/[a-z0-9-]+$/.test(path);
}

/** The sign-in or sign-up page, returning to `returnTo` afterwards. */
export function authUrl(page: "/sign-in" | "/sign-up", returnTo: string): string {
  return `${page}?redirect_url=${encodeURIComponent(returnTo)}`;
}

export function parseResumeLesson(raw: string | null, now: number): ResumeLesson | null {
  if (!raw) return null;
  try {
    const { path, title, at } = JSON.parse(raw) as Record<string, unknown>;
    if (!isLessonPath(path) || typeof title !== "string" || typeof at !== "number") return null;
    if (now - at > KEEP_MS || at > now) return null;
    return { path, title };
  } catch {
    return null;
  }
}

export function rememberLesson(lesson: ResumeLesson): void {
  if (!isLessonPath(lesson.path)) return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...lesson, at: Date.now() }));
  } catch {
    // Storage blocked: the visitor lands on the dashboard without the shortcut.
  }
}

export function recallLesson(): ResumeLesson | null {
  try {
    return parseResumeLesson(localStorage.getItem(KEY), Date.now());
  } catch {
    return null;
  }
}

export function forgetLesson(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to remove.
  }
}
