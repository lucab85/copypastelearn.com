import { describe, expect, it } from "vitest";
import type { CourseListItem, UpcomingCourse } from "@copypastelearn/shared";
import {
  buildHomeColumns,
  byRecentUpdate,
  byRecentPublish,
  courseMeta,
  featuredCourse,
  formatDuration,
  isNewCourse,
  latestUpdatedCourse,
  NEW_COURSE_DAYS,
  newCourses,
  trackCount,
  trackGroups,
} from "@/lib/home-catalog";
import { COURSE_TRACKS } from "@/lib/course-tracks";
import { footerSections } from "@/lib/footer-links";
import { HOME_FAQ } from "@/lib/home-faq";
import { TESTIMONIALS } from "@/lib/testimonials";
import { getAllCategories } from "@/lib/blog-taxonomy";

function course(
  slug: string,
  extra: Partial<CourseListItem> = {}
): CourseListItem {
  return {
    id: slug,
    slug,
    title: slug,
    description: "",
    difficulty: "INTERMEDIATE",
    lessonCount: 6,
    thumbnailUrl: null,
    track: "AI_AGENTS",
    durationMinutes: 45,
    updatedAt: null,
    ...extra,
  };
}

describe("course meta line", () => {
  it("formats minutes and hours", () => {
    expect(formatDuration(32)).toBe("32 min");
    expect(formatDuration(240)).toBe("4 h");
    expect(formatDuration(90)).toBe("1 h 30 min");
  });

  it("leaves out what the course does not have", () => {
    expect(courseMeta(course("a"))).toBe("Intermediate · 6 lessons · 45 min");
    expect(
      courseMeta(course("a", { lessonCount: 1, durationMinutes: null }))
    ).toBe("Intermediate · 1 lesson");
    expect(courseMeta(course("a", { lessonCount: 0, durationMinutes: 0 }))).toBe(
      "Intermediate"
    );
  });
});

describe("recent updates", () => {
  const courses = [
    course("undated"),
    course("old", { updatedAt: "2026-11-13T00:00:00.000Z" }),
    course("new-a", { updatedAt: "2026-11-18T00:00:00.000Z" }),
    course("new-b", { updatedAt: "2026-11-18T00:00:00.000Z" }),
  ];

  it("orders dated courses newest first and keeps catalog order on a tie", () => {
    expect(byRecentUpdate(courses).map((c) => c.slug)).toEqual([
      "new-a",
      "new-b",
      "old",
    ]);
  });

  it("picks the latest course that is not already pictured", () => {
    expect(latestUpdatedCourse(courses)?.slug).toBe("new-a");
    expect(latestUpdatedCourse(courses, ["new-a"])?.slug).toBe("new-b");
    expect(latestUpdatedCourse([course("undated")])).toBeNull();
  });
});

describe("new course rule", () => {
  const now = new Date("2026-12-18T12:00:00.000Z");
  const day = 24 * 60 * 60 * 1000;
  const daysAgo = (n: number) => new Date(now.getTime() - n * day).toISOString();

  it(`is new for ${NEW_COURSE_DAYS} days after the publish date, not after`, () => {
    expect(isNewCourse(daysAgo(0), now)).toBe(true);
    expect(isNewCourse(daysAgo(29), now)).toBe(true);
    expect(isNewCourse(daysAgo(30), now)).toBe(true);
    expect(isNewCourse(new Date(now.getTime() - 30 * day - 1).toISOString(), now)).toBe(false);
    expect(isNewCourse(daysAgo(31), now)).toBe(false);
    expect(isNewCourse(daysAgo(400), now)).toBe(false);
  });

  it("is never new without a publish date", () => {
    expect(isNewCourse(null, now)).toBe(false);
    expect(isNewCourse(undefined, now)).toBe(false);
    expect(isNewCourse("not a date", now)).toBe(false);
  });

  it("orders by publish date, newest first; in a batch the last of the catalog comes first", () => {
    const courses = [
      course("draft-like"),
      course("old", { publishedAt: daysAgo(200) }),
      course("batch-1", { publishedAt: daysAgo(10) }),
      course("batch-2", { publishedAt: daysAgo(10) }),
    ];
    expect(byRecentPublish(courses).map((c) => c.slug)).toEqual([
      "batch-2",
      "batch-1",
      "old",
    ]);
  });

  it("features the newest course with the New label while it is new", () => {
    const courses = [
      course("old", { publishedAt: daysAgo(200), updatedAt: daysAgo(1) }),
      course("fresh", { publishedAt: daysAgo(5) }),
    ];
    const featured = featuredCourse(courses, now);
    expect(featured?.course.slug).toBe("fresh");
    expect(featured?.isNew).toBe(true);
    expect(featured?.date).toBe(courses[1].publishedAt);
  });

  it("skips a course already pictured on another card when there is another new one", () => {
    const courses = [
      course("a", { publishedAt: daysAgo(5) }),
      course("b", { publishedAt: daysAgo(5) }),
    ];
    expect(featuredCourse(courses, now, ["b"])?.course.slug).toBe("a");
    expect(featuredCourse([courses[1]], now, ["b"])?.course.slug).toBe("b");
  });

  it("falls back to the most recently updated course, without the label, after 30 days", () => {
    const courses = [
      course("published-long-ago", { publishedAt: daysAgo(31) }),
      course("updated", { publishedAt: daysAgo(300), updatedAt: daysAgo(2) }),
    ];
    const featured = featuredCourse(courses, now);
    expect(featured?.course.slug).toBe("updated");
    expect(featured?.isNew).toBe(false);
    expect(featured?.date).toBe(courses[1].updatedAt);
  });

  it("shows no card when nothing is new and nothing has a content date", () => {
    expect(featuredCourse([course("x", { publishedAt: daysAgo(90) })], now)).toBeNull();
    expect(featuredCourse([], now)).toBeNull();
  });
});

describe("home columns", () => {
  it("names each column by the signal it is sorted on and never repeats a course when it can avoid it", () => {
    const courses = [
      ...["d1", "d2", "d3"].map((s) =>
        course(s, { updatedAt: "2026-11-18T00:00:00.000Z" })
      ),
      ...["b1", "b2", "b3"].map((s) =>
        course(s, { difficulty: "BEGINNER", track: "FOUNDATIONS" })
      ),
      ...["s1", "s2", "s3"].map((s, i) =>
        course(s, { durationMinutes: 30 - i, track: "AI_HOMELAB" })
      ),
    ];
    const columns = buildHomeColumns(courses);
    expect(columns.map((c) => c.title)).toEqual([
      "Recently updated",
      "Beginner friendly",
      "30 minutes or less",
    ]);
    expect(columns[2].courses.map((c) => c.slug)).toEqual(["s3", "s2", "s1"]);
    const shown = columns.flatMap((c) => c.courses.map((x) => x.slug));
    expect(new Set(shown).size).toBe(shown.length);
    expect(columns.every((c) => c.href.startsWith("/courses"))).toBe(true);
  });

  it("falls back to tracks, and drops a list with fewer than two courses", () => {
    const courses = [
      course("a1"),
      course("a2"),
      course("f1", { track: "FOUNDATIONS" }),
    ];
    const columns = buildHomeColumns(courses);
    expect(columns.map((c) => c.id)).toEqual(["track-ai-agents"]);
    expect(columns[0].href).toBe("/courses#ai-agents");
    expect(buildHomeColumns([])).toEqual([]);
  });
});

describe("new courses", () => {
  const now = new Date("2026-11-26T12:00:00.000Z");
  const at = (days: number) =>
    new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

  it("lists every course of the last 30 days, newest first, and nothing older", () => {
    const courses = [
      course("old", { publishedAt: at(90) }),
      course("n1", { publishedAt: at(3) }),
      course("undated"),
      course("n2", { publishedAt: at(1) }),
      course("n3", { publishedAt: at(1) }),
    ];
    expect(newCourses(courses, now).map((c) => c.slug)).toEqual(["n3", "n2", "n1"]);
    expect(newCourses(courses, now, 2).map((c) => c.slug)).toEqual(["n3", "n2"]);
    expect(newCourses([course("old", { publishedAt: at(31) })], now)).toEqual([]);
  });

  it("keeps the courses shown above out of the columns when there are others", () => {
    const courses = [
      ...["n1", "n2", "n3"].map((s) =>
        course(s, { updatedAt: "2026-11-25T00:00:00.000Z" })
      ),
      ...["d1", "d2", "d3"].map((s) =>
        course(s, { updatedAt: "2026-11-18T00:00:00.000Z" })
      ),
    ];
    const [updated] = buildHomeColumns(courses, 3, ["n1", "n2", "n3"]);
    expect(updated.title).toBe("Recently updated");
    expect(updated.courses.map((c) => c.slug)).toEqual(["d1", "d2", "d3"]);
  });
});

describe("track groups", () => {
  const upcoming: UpcomingCourse[] = [
    {
      id: "u1",
      title: "Soon",
      description: "",
      difficulty: "BEGINNER",
      track: "AI_HOMELAB",
    },
  ];

  it("returns only tracks with something to show", () => {
    const groups = trackGroups([course("a1")], upcoming);
    expect(groups.map((g) => g.track.id)).toEqual(["AI_AGENTS", "AI_HOMELAB"]);
    expect(groups[1].courses).toHaveLength(0);
    expect(groups[1].upcoming).toHaveLength(1);
  });

  it("counts courses and coming-soon courses", () => {
    expect(trackCount(5, 1)).toBe("5 courses, 1 coming soon");
    expect(trackCount(1, 0)).toBe("1 course");
    expect(trackCount(0, 2)).toBe("2 coming soon");
  });
});

describe("static links and copy", () => {
  it("links only tracks and article categories that exist", () => {
    const anchors = COURSE_TRACKS.map((t) => `/courses#${t.anchor}`);
    const categories = getAllCategories().map((c) => `/blog/category/${c.slug}`);
    for (const { href } of footerSections.flatMap((s) => s.links)) {
      if (href.startsWith("/courses#")) expect(anchors).toContain(href);
      if (href.startsWith("/blog/category/")) expect(categories).toContain(href);
    }
  });

  it("keeps every legal link in the footer", () => {
    const hrefs = footerSections.flatMap((s) => s.links.map((l) => l.href));
    expect(hrefs).toEqual(expect.arrayContaining(["/privacy", "/terms"]));
  });

  it("has FAQ answers long enough for FAQPage data, each with its source", () => {
    expect(HOME_FAQ.length).toBeGreaterThanOrEqual(2);
    for (const item of HOME_FAQ) {
      expect(item.question.endsWith("?")).toBe(true);
      expect(item.answer.length).toBeGreaterThanOrEqual(50);
      expect(item.source.length).toBeGreaterThan(0);
    }
  });

  it("keeps the FAQ to what the site supports: no lab promise, no price, no Discord", () => {
    for (const item of HOME_FAQ) {
      const text = `${item.question} ${item.answer}`.toLowerCase();
      expect(text).not.toMatch(/\blabs?\b|sandbox/);
      expect(text).not.toMatch(/[€$£]|\beur\b|\busd\b|per month|\/month|\/mo\b/);
      expect(text).not.toContain("discord");
    }
  });

  it("keeps the three learner quotes as they were, with nothing added", () => {
    expect(TESTIMONIALS.map((t) => t.name)).toEqual([
      "Marco R.",
      "Sarah K.",
      "James L.",
    ]);
    for (const t of TESTIMONIALS) {
      expect(Object.keys(t).sort()).toEqual(
        ["company", "name", "outcome", "role", "text"].sort()
      );
    }
    expect(TESTIMONIALS[2].text).toBe(
      "I went from zero to deploying containerized services in production after the Docker Fundamentals course. The copy-paste workflow is genius."
    );
  });
});
