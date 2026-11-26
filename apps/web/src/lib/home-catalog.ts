import type { CourseListItem, UpcomingCourse } from "@copypastelearn/shared";
import { COURSE_TRACKS, type TrackInfo } from "@/lib/course-tracks";

/**
 * Home page catalog cuts. Every list here is ordered by a signal the database
 * really has (content date, difficulty, video time, track, catalog order).
 * There is no popularity data, so nothing is called "popular".
 */

const DIFFICULTY_LABEL: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

export function difficultyLabel(difficulty: string): string {
  return (
    DIFFICULTY_LABEL[difficulty] ??
    difficulty.charAt(0) + difficulty.slice(1).toLowerCase()
  );
}

/** 32 -> "32 min", 240 -> "4 h", 90 -> "1 h 30 min". */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** The quiet line under a course title: "Beginner · 6 lessons · 32 min". */
export function courseMeta(
  course: Pick<CourseListItem, "difficulty" | "lessonCount" | "durationMinutes">
): string {
  const parts = [difficultyLabel(course.difficulty)];
  if (course.lessonCount > 0) {
    parts.push(
      `${course.lessonCount} ${course.lessonCount === 1 ? "lesson" : "lessons"}`
    );
  }
  if (course.durationMinutes) parts.push(formatDuration(course.durationMinutes));
  return parts.join(" · ");
}

/** "Nov 2026" from an ISO date (UTC, like the course page). */
export function formatMonth(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Courses with a content date, newest first; catalog order breaks ties. */
export function byRecentUpdate(courses: CourseListItem[]): CourseListItem[] {
  return courses
    .filter((c) => !!c.updatedAt)
    .map((course, index) => ({ course, index }))
    .sort(
      (a, b) =>
        Date.parse(b.course.updatedAt as string) -
          Date.parse(a.course.updatedAt as string) || a.index - b.index
    )
    .map(({ course }) => course);
}

/**
 * The course for the "latest update" promo card: the most recently dated
 * course that is not already pictured on another card.
 */
export function latestUpdatedCourse(
  courses: CourseListItem[],
  excludeSlugs: string[] = []
): CourseListItem | null {
  const dated = byRecentUpdate(courses);
  return dated.find((c) => !excludeSlugs.includes(c.slug)) ?? dated[0] ?? null;
}

/** A course counts as new for this many days after it was first published. */
export const NEW_COURSE_DAYS = 30;

/** True when `publishedAt` is at most NEW_COURSE_DAYS before `now`. */
export function isNewCourse(
  publishedAt: string | null | undefined,
  now: Date
): boolean {
  if (!publishedAt) return false;
  const published = Date.parse(publishedAt);
  if (Number.isNaN(published)) return false;
  return now.getTime() - published <= NEW_COURSE_DAYS * 24 * 60 * 60 * 1000;
}

/**
 * Courses with a publish date, newest first. Courses published at the same
 * moment (a batch) are ordered by catalog position, last one first: the
 * course added to the catalog last is the latest of the batch.
 */
export function byRecentPublish(courses: CourseListItem[]): CourseListItem[] {
  return courses
    .filter((c) => !!c.publishedAt && !Number.isNaN(Date.parse(c.publishedAt)))
    .map((course, index) => ({ course, index }))
    .sort(
      (a, b) =>
        Date.parse(b.course.publishedAt as string) -
          Date.parse(a.course.publishedAt as string) || b.index - a.index
    )
    .map(({ course }) => course);
}

/**
 * Courses first published within the last NEW_COURSE_DAYS days, newest first.
 * The home page lists them in their own section and the cards carry "New".
 */
export function newCourses(
  courses: CourseListItem[],
  now: Date,
  limit = 6
): CourseListItem[] {
  return byRecentPublish(courses)
    .filter((c) => isNewCourse(c.publishedAt, now))
    .slice(0, limit);
}

export interface FeaturedCourse {
  course: CourseListItem;
  /** Published within the last NEW_COURSE_DAYS days: the card may say "New". */
  isNew: boolean;
  /** ISO date the card shows: the publish date when new, else the content date. */
  date: string;
}

/**
 * The course for the third promo card. The most recently published course,
 * labelled new, when it was published within the last NEW_COURSE_DAYS days;
 * otherwise the most recently updated course, with no label. Courses already
 * pictured on another card (`excludeSlugs`) are skipped when there is another.
 */
export function featuredCourse(
  courses: CourseListItem[],
  now: Date,
  excludeSlugs: string[] = []
): FeaturedCourse | null {
  const published = byRecentPublish(courses);
  const newest =
    published.find((c) => !excludeSlugs.includes(c.slug)) ?? published[0];
  if (newest?.publishedAt && isNewCourse(newest.publishedAt, now)) {
    return { course: newest, isNew: true, date: newest.publishedAt };
  }
  const updated = latestUpdatedCourse(courses, excludeSlugs);
  return updated?.updatedAt
    ? { course: updated, isNew: false, date: updated.updatedAt }
    : null;
}

export interface HomeColumn {
  id: string;
  title: string;
  /** Where "see all" goes. Always a page that exists. */
  href: string;
  hrefLabel: string;
  courses: CourseListItem[];
}

export const SHORT_COURSE_MINUTES = 30;

/**
 * Up to three titled lists of `size` courses for the home page. A list needs
 * at least two courses to be shown. A later list skips courses an earlier
 * list already shows whenever it has enough others, so a small catalog is
 * not shown as the same three cards three times, and a course already listed
 * above the columns (`shownIds`) is left to the lists that have others. When the dated, beginner
 * and short lists do not fill three columns, tracks fill the rest.
 */
export function buildHomeColumns(
  courses: CourseListItem[],
  size = 3,
  /** Ids already shown above the columns (the "New courses" section). */
  shownIds: string[] = []
): HomeColumn[] {
  const candidates: Omit<HomeColumn, "courses">[] = [];
  const pools = new Map<string, CourseListItem[]>();
  const add = (
    column: Omit<HomeColumn, "courses">,
    pool: CourseListItem[]
  ) => {
    candidates.push(column);
    pools.set(column.id, pool);
  };

  add(
    {
      id: "recently-updated",
      title: "Recently updated",
      href: "/courses",
      hrefLabel: "All courses",
    },
    byRecentUpdate(courses)
  );
  add(
    {
      id: "beginner",
      title: "Beginner friendly",
      href: "/courses?level=beginner",
      hrefLabel: "All beginner courses",
    },
    courses.filter((c) => c.difficulty === "BEGINNER")
  );
  add(
    {
      id: "short",
      title: `${SHORT_COURSE_MINUTES} minutes or less`,
      href: "/courses",
      hrefLabel: "All courses",
    },
    courses
      .filter(
        (c) => !!c.durationMinutes && c.durationMinutes <= SHORT_COURSE_MINUTES
      )
      .sort((a, b) => (a.durationMinutes ?? 0) - (b.durationMinutes ?? 0))
  );
  for (const track of COURSE_TRACKS) {
    if (track.id === "OTHER") continue;
    add(
      {
        id: `track-${track.anchor}`,
        title: track.title,
        href: `/courses#${track.anchor}`,
        hrefLabel: `All ${track.title} courses`,
      },
      courses.filter((c) => c.track === track.id)
    );
  }

  const used = new Set<string>(shownIds);
  const columns: HomeColumn[] = [];
  for (const column of candidates) {
    if (columns.length === 3) break;
    const pool = pools.get(column.id) ?? [];
    if (pool.length < 2) continue;
    const fresh = pool.filter((c) => !used.has(c.id));
    const picked = (fresh.length >= size ? fresh : pool).slice(0, size);
    picked.forEach((c) => used.add(c.id));
    columns.push({ ...column, courses: picked });
  }
  return columns;
}

export interface TrackGroup {
  track: TrackInfo;
  courses: CourseListItem[];
  upcoming: UpcomingCourse[];
}

/**
 * Tracks that have something to show, in catalog order. Same rule as the
 * catalog page, so `/courses#<anchor>` exists for every group returned.
 */
export function trackGroups(
  courses: CourseListItem[],
  upcoming: UpcomingCourse[],
  { includeOther = false }: { includeOther?: boolean } = {}
): TrackGroup[] {
  return COURSE_TRACKS.filter((t) => includeOther || t.id !== "OTHER")
    .map((track) => {
      const inTrack = (t: string | null | undefined) =>
        track.id === "OTHER" ? !t : t === track.id;
      return {
        track,
        courses: courses.filter((c) => inTrack(c.track)),
        upcoming: upcoming.filter((c) => inTrack(c.track)),
      };
    })
    .filter((g) => g.courses.length + g.upcoming.length > 0);
}

/** "3 courses, 1 coming soon" (either part may be missing). */
export function trackCount(published: number, soon: number): string {
  const parts: string[] = [];
  if (published > 0) {
    parts.push(`${published} ${published === 1 ? "course" : "courses"}`);
  }
  if (soon > 0) parts.push(`${soon} coming soon`);
  return parts.join(", ");
}
