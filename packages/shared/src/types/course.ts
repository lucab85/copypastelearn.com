// ─── Course Types ───────────────────────────────────────

export type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export type ContentStatus = "DRAFT" | "PUBLISHED";

export interface CourseListItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: Difficulty;
  lessonCount: number;
  thumbnailUrl: string | null;
  userProgress?: { percentComplete: number } | null;
}

export interface CourseDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  outcomes: string[];
  prerequisites: string[];
  difficulty: Difficulty;
  estimatedDuration: number | null;
  thumbnailUrl: string | null;
  lessons: LessonSummary[];
  userProgress?: CourseProgressInfo | null;
}

export interface CourseProgressInfo {
  percentComplete: number;
  startedAt: string;
  completedAt: string | null;
}

// ─── Lesson Types ───────────────────────────────────────

export interface LessonSummary {
  id: string;
  title: string;
  slug: string;
  sortOrder: number;
  durationSeconds: number | null;
  hasLab: boolean;
  isFree: boolean;
  isAccessible: boolean;
  userProgress?: {
    completed: boolean;
    videoPositionSeconds: number;
  } | null;
}

export interface LessonDetail {
  id: string;
  title: string;
  courseSlug: string;
  videoPlaybackId: string | null;
  transcript: string | null;
  codeSnippets: CodeSnippet[] | null;
  resources: Resource[] | null;
  labDefinitionId: string | null;
  userProgress: LessonProgressInfo | null;
  nextLesson: LessonNav | null;
  previousLesson: LessonNav | null;
}

export interface CodeSnippet {
  label: string;
  language: string;
  code: string;
}

export interface Resource {
  title: string;
  url: string;
  type: string;
}

export interface LessonNav {
  slug: string;
  title: string;
}

export interface LessonProgressInfo {
  videoPositionSeconds: number;
  completed: boolean;
  lastAccessedAt: string;
}

// ─── Subscription Types ─────────────────────────────────

export type SubscriptionStatus = "ACTIVE" | "CANCELED" | "EXPIRED" | "PAST_DUE" | "NONE";

export interface SubscriptionInfo {
  isSubscribed: boolean;
  status: SubscriptionStatus | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  planId: string | null;
}

// ─── Dashboard Types ────────────────────────────────────

export interface DashboardCourse {
  courseId: string;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
  percentComplete: number;
  completedAt: string | null;
  nextLesson: { slug: string; title: string } | null;
}

export interface DashboardData {
  inProgressCourses: DashboardCourse[];
  completedCourses: DashboardCourse[];
  recentLessons: RecentLesson[];
  activeLabSession: ActiveLabSession | null;
}

export interface RecentLesson {
  lessonId: string;
  title: string;
  slug: string;
  courseTitle: string;
  courseSlug: string;
  lastAccessedAt: string;
  completed: boolean;
}

export interface ActiveLabSession {
  sessionId: string;
  labTitle: string;
  status: string;
  expiresAt: string;
}
