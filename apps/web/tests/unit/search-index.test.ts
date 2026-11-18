import { describe, expect, it } from "vitest";
import {
  MAX_COURSE_RESULTS,
  MAX_RESULTS,
  searchAll,
  shortText,
  type SearchIndex,
} from "@/lib/search-index";

const index: SearchIndex = {
  courses: [
    {
      slug: "docker-fundamentals",
      title: "Docker Fundamentals",
      description: "Build, ship, and run containers.",
      track: "Foundations",
      level: "Beginner",
    },
    {
      slug: "kagent-ai-agents-on-kubernetes",
      title: "kagent 1.0: Run AI Agents on Kubernetes",
      description: "Install kagent and build a Kubernetes-native agent.",
      track: "AI Agents",
      level: "Intermediate",
    },
  ],
  items: [
    {
      slug: "docker-compose-basics",
      title: "Docker Compose Basics",
      description: "Run several containers together.",
      category: "DevOps",
      tags: ["Docker", "Compose"],
    },
    {
      slug: "golden-paths",
      title: "Golden Paths in Platform Engineering",
      description: "A paved road for developers.",
      category: "DevOps",
      tags: ["Platform Engineering"],
    },
  ],
};

describe("palette search", () => {
  it("puts matching courses above articles, tags and categories", () => {
    const results = searchAll(index, "docker");
    expect(results[0]).toMatchObject({
      type: "course",
      href: "/courses/docker-fundamentals",
      title: "Docker Fundamentals",
    });
    expect(results[0].subtitle).toBe(
      "Foundations · Beginner · Build, ship, and run containers."
    );
    const types = results.map((r) => r.type);
    expect(types.lastIndexOf("course")).toBeLessThan(types.indexOf("post"));
    expect(results.some((r) => r.href === "/blog/docker-compose-basics")).toBe(true);
    expect(results.some((r) => r.href === "/blog/tag/docker")).toBe(true);
  });

  it("finds a course by its track and by its level", () => {
    expect(searchAll(index, "ai agents")[0].href).toBe(
      "/courses/kagent-ai-agents-on-kubernetes"
    );
    expect(searchAll(index, "beginner")[0].href).toBe("/courses/docker-fundamentals");
  });

  it("still finds articles when no course matches", () => {
    const results = searchAll(index, "golden");
    expect(results.map((r) => r.type)).toEqual(["post"]);
    expect(results[0].href).toBe("/blog/golden-paths");
  });

  it("returns nothing for a query with no match (the empty state)", () => {
    expect(searchAll(index, "zzzz")).toEqual([]);
  });

  it("with no query shows courses first, then recent posts", () => {
    const results = searchAll(index, "  ");
    expect(results.map((r) => r.type)).toEqual(["course", "course", "post", "post"]);
  });

  it("caps courses and the total", () => {
    const many: SearchIndex = {
      courses: Array.from({ length: 20 }, (_, i) => ({
        slug: `docker-${i}`,
        title: `Docker ${i}`,
        description: "",
        track: null,
        level: "Beginner",
      })),
      items: Array.from({ length: 30 }, (_, i) => ({
        slug: `post-${i}`,
        title: `Docker post ${i}`,
        description: "",
        category: "DevOps",
        tags: [],
      })),
    };
    const results = searchAll(many, "docker");
    expect(results).toHaveLength(MAX_RESULTS);
    expect(results.filter((r) => r.type === "course")).toHaveLength(MAX_COURSE_RESULTS);
    expect(searchAll(many, "")).toHaveLength(MAX_RESULTS);
  });

  it("links only what is in the index: a course that is not there is never a result", () => {
    // The route builds `courses` from published courses only; an announced
    // draft is not in the index, so no query can produce a link to it.
    const hrefs = searchAll(index, "offload").map((r) => r.href);
    expect(hrefs.some((h) => h.startsWith("/courses/"))).toBe(false);
  });
});

describe("short description", () => {
  it("keeps the first paragraph and cuts at a word", () => {
    expect(shortText("One.\n\nTwo.")).toBe("One.");
    const long = "word ".repeat(60).trim();
    const cut = shortText(long, 40);
    expect(cut.length).toBeLessThanOrEqual(41);
    expect(cut.endsWith("…")).toBe(true);
    expect(cut).not.toMatch(/wor…$/);
  });
});
