import { describe, expect, it } from "vitest";
import type { CourseListItem, UpcomingCourse } from "@copypastelearn/shared";
import {
  buildHomeColumns,
  byRecentUpdate,
  courseMeta,
  formatDuration,
  latestUpdatedCourse,
  trackCount,
  trackGroups,
} from "@/lib/home-catalog";
import { COURSE_TRACKS } from "@/lib/course-tracks";
import { footerSections } from "@/lib/footer-links";
import { HOME_FAQ } from "@/lib/home-faq";
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

  it("has FAQ answers long enough for FAQPage data and makes no lab promise", () => {
    expect(HOME_FAQ.length).toBeGreaterThanOrEqual(2);
    for (const item of HOME_FAQ) {
      expect(item.question.endsWith("?")).toBe(true);
      expect(item.answer.length).toBeGreaterThanOrEqual(50);
      expect(item.answer.toLowerCase()).not.toMatch(/\blabs?\b|sandbox/);
    }
  });
});
