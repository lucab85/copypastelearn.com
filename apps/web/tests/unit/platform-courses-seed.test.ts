import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { seedTenancyCourse } from "../../prisma/seeds/tenancy-course";
import { seedTalosCourse } from "../../prisma/seeds/talos-course";
import { seedKamajiCourse } from "../../prisma/seeds/kamaji-course";
import { seedOpenFeatureCourse } from "../../prisma/seeds/openfeature-course";
import { seedGraphqlMcpCourse } from "../../prisma/seeds/graphql-mcp-course";

/**
 * The five courses of November 2026 are seeded as DRAFT. These tests pin the rules that keep a re-run of the seed
 * from publishing, announcing or overwriting anything, and the shape the lesson pages rely on.
 */

type Call = { where: unknown; update: Record<string, unknown>; create: Record<string, unknown> };

function fakePrisma() {
  const courses: Call[] = [];
  const lessons: Call[] = [];
  const prisma = {
    course: {
      aggregate: async () => ({ _max: { sortOrder: 12 } }),
      upsert: async (args: Call) => {
        courses.push(args);
        return { id: "course-id", title: String(args.create.title) };
      },
    },
    lesson: {
      upsert: async (args: Call) => {
        lessons.push(args);
        return {};
      },
    },
  } as unknown as PrismaClient;
  return { prisma, courses, lessons };
}

const SEEDS = [
  { name: "tenancy", seed: seedTenancyCourse, track: "AI_HOMELAB" },
  { name: "talos", seed: seedTalosCourse, track: "AI_HOMELAB" },
  { name: "kamaji", seed: seedKamajiCourse, track: "AI_HOMELAB" },
  { name: "openfeature", seed: seedOpenFeatureCourse, track: "FOUNDATIONS" },
  { name: "graphql-mcp", seed: seedGraphqlMcpCourse, track: "AI_AGENTS" },
];

describe.each(SEEDS)("$name course seed", ({ seed, track }) => {
  it("creates one DRAFT, unannounced course with a cover, and a re-run changes nothing on it", async () => {
    const { prisma, courses } = fakePrisma();
    await seed(prisma);
    expect(courses).toHaveLength(1);
    const [c] = courses;
    expect(c.update).toEqual({});
    expect(c.create.status).toBe("DRAFT");
    expect(c.create.announced).toBe(false);
    expect(c.create.track).toBe(track);
    expect(c.create.sortOrder).toBe(13);
    const slug = String(c.create.slug);
    expect(fs.existsSync(path.join(__dirname, "../../public/images/courses", `${slug}.svg`))).toBe(true);
    expect(c.create.thumbnailUrl).toBe(`/images/courses/${slug}.svg`);
    // the narration is a synthetic voice of the author: said on the course page (STANDARD.md)
    expect(String(c.create.description)).toMatch(/synthetic voice made from the author's own voice/);
    expect((c.create.outcomes as string[]).length).toBeGreaterThanOrEqual(5);
    expect((c.create.prerequisites as string[]).length).toBeGreaterThanOrEqual(3);
  });

  it("has six DRAFT lessons that a re-run refreshes by text only", async () => {
    const { prisma, lessons } = fakePrisma();
    await seed(prisma);
    expect(lessons).toHaveLength(6);
    expect(lessons.map((l) => l.create.sortOrder)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(String(lessons[0].create.description)).toMatch(/synthetic voice/); // and in the first lesson's notes
    expect(new Set(lessons.map((l) => l.create.slug)).size).toBe(6);
    for (const l of lessons) {
      expect(l.create.status).toBe("DRAFT");
      for (const forbidden of ["status", "videoPlaybackId", "durationSeconds", "transcript"]) {
        expect(l.update).not.toHaveProperty(forbidden);
      }
    }
  });

  it("gives every lesson a description, copyable code and checked links, as plain text", async () => {
    const { prisma, lessons, courses } = fakePrisma();
    await seed(prisma);
    expect(String(courses[0].create.description)).not.toMatch(/\]\(http/);
    for (const l of lessons) {
      expect(String(l.create.description).length).toBeGreaterThan(60);
      expect(String(l.create.description)).not.toMatch(/\]\(http/);
      const snippets = l.create.codeSnippets as { label: string; language: string; code: string }[];
      expect(snippets.length).toBeGreaterThanOrEqual(1);
      for (const s of snippets) {
        expect(s.label.length).toBeGreaterThan(0);
        expect(s.language.length).toBeGreaterThan(0);
        expect(s.code.trim().length).toBeGreaterThan(0);
        // a demo home, a host name or a key must never reach a lesson page
        expect(s.code).not.toMatch(/\/Users\/|lberton|luca-lab|BEGIN [A-Z ]*PRIVATE KEY/i);
      }
      const resources = l.create.resources as { title: string; url: string }[];
      expect(resources.length).toBeGreaterThanOrEqual(2);
      for (const r of resources) {
        expect(r.title.length).toBeGreaterThan(0);
        expect(r.url).toMatch(/^https:\/\//);
      }
    }
  });
});

describe("the five seeds together", () => {
  it("use five different course slugs", async () => {
    const slugs = new Set<string>();
    for (const { seed } of SEEDS) {
      const { prisma, courses } = fakePrisma();
      await seed(prisma);
      slugs.add(String(courses[0].create.slug));
    }
    expect(slugs.size).toBe(5);
  });
});
