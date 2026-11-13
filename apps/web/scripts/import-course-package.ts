/**
 * Import a course package as a DRAFT course: from a folder of finished videos
 * and documents to a course on the site in one command.
 *
 *   pnpm course:import <package dir> [--track AI_HOMELAB] [--difficulty BEGINNER]
 *                                    [--refresh] [--upload] [--dry-run]
 *
 * A package is a folder with:
 *   manifest.csv              course_slug,sort_order,lesson_slug,lesson_title,file,duration_s,...,source
 *                             (source ends in m<module>l<lesson>, e.g. local-ai-m1l2)
 *   COURSE-PAGE.md            title, description, "What you will learn",
 *                             "Before you start", one "### NN. M1L1: title" per lesson
 *   subtitles/NN-<slug>.txt   transcript of each lesson            (optional)
 *   *-final-assessment.md     final assessment                     (optional)
 *   *-hands-on-lab.md         Hands-On Lab document                (optional)
 *   videos/promo.mp4          course promo                         (optional, --upload)
 *
 * What it never does: publish. The course and new lessons are created as
 * DRAFT, and `announced` is left alone. A re-run refreshes lesson text,
 * module, duration, transcript, the assessment and the lab guide; it never
 * changes a status, never replaces a video that is already set, and changes
 * the course title/description/outcomes only with --refresh.
 *
 * --upload sends the videos of lessons that have no playback ID yet to Mux
 * (signed playback; the promo is public) and stores the playback IDs. It needs
 * MUX_ACCESS_TOKEN and MUX_SECRET_KEY (an API access token, not the signing
 * key the site uses for playback).
 */

import fs from "node:fs";
import path from "node:path";
import { PrismaClient, type CourseTrack, type Difficulty, type Prisma } from "@prisma/client";
import { parseAssessmentMarkdown } from "../src/lib/assessment";

// ─── Package parsing (pure, exported for tests) ─────────────────────────────

export interface PackageLesson {
  slug: string;
  title: string;
  sortOrder: number;
  file: string;
  durationSeconds: number | null;
  moduleNumber: number | null;
  description: string | null;
}

export function parseManifest(csv: string): { courseSlug: string; lessons: PackageLesson[] } {
  const [header, ...rows] = csv.trim().split(/\r?\n/);
  const cols = header.split(",");
  const need = ["course_slug", "sort_order", "lesson_slug", "lesson_title", "file"];
  for (const c of need) if (!cols.includes(c)) throw new Error(`manifest.csv: no column ${c}`);
  const lessons = rows.filter(Boolean).map((row, i) => {
    const cells = splitCsvRow(row);
    const get = (name: string) => cells[cols.indexOf(name)] ?? "";
    const module = get("source").match(/m(\d+)l\d+$/i);
    const duration = Number(get("duration_s"));
    if (!get("lesson_slug") || !get("lesson_title")) {
      throw new Error(`manifest.csv row ${i + 2}: no lesson slug or title`);
    }
    return {
      courseSlug: get("course_slug"),
      slug: get("lesson_slug"),
      title: get("lesson_title"),
      sortOrder: Number(get("sort_order")),
      file: get("file"),
      durationSeconds: Number.isFinite(duration) && duration > 0 ? Math.round(duration) : null,
      moduleNumber: module ? Number(module[1]) : null,
      description: null as string | null,
    };
  });
  const slugs = new Set(lessons.map((l) => l.courseSlug));
  if (lessons.length === 0) throw new Error("manifest.csv: no lessons");
  if (slugs.size !== 1) throw new Error(`manifest.csv: more than one course_slug (${[...slugs].join(", ")})`);
  return {
    courseSlug: lessons[0].courseSlug,
    lessons: lessons.map(({ courseSlug: _c, ...l }) => l).sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

function splitCsvRow(row: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (quoted) {
      if (ch === '"' && row[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

export interface CoursePage {
  title: string;
  description: string;
  outcomes: string[];
  prerequisites: string[];
  /** Lesson descriptions in the order of the "### NN." headings. */
  lessonDescriptions: string[];
}

export function parseCoursePage(md: string): CoursePage {
  // Drop HTML comments and block quotes (generator notes, not course text).
  const text = md.replace(/<!--[\s\S]*?-->/g, "").replace(/^>.*$/gm, "");
  const title = text.match(/^#\s+(.+)$/m)?.[1].trim();
  if (!title) throw new Error("COURSE-PAGE.md: no '# Title'");

  const sections = text.split(/^##\s+/m);
  const intro = sections[0].replace(/^#\s+.+$/m, "");
  const paragraphs = (block: string) =>
    block.split(/\n\s*\n/).map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean);
  const description = paragraphs(intro)
    .filter((p) => !/^\*[^*].*\*$/.test(p)) // the one-line subtitle in italics
    .join("\n\n");
  const list = (name: RegExp) => {
    const section = sections.find((s) => name.test(s.split("\n")[0]));
    return section
      ? section.split("\n").filter((l) => /^\s*-\s+/.test(l)).map((l) => l.replace(/^\s*-\s+/, "").trim())
      : [];
  };
  const lessonsSection = sections.find((s) => /^Lessons/i.test(s)) ?? "";
  const lessonDescriptions = lessonsSection
    .split(/^###\s+/m)
    .slice(1)
    .map((block) => {
      const body = block.split("\n").slice(1).join("\n").split(/^Chapters:/m)[0];
      return paragraphs(body)[0] ?? "";
    });

  if (!description) throw new Error("COURSE-PAGE.md: no description under the title");
  return {
    title,
    description,
    outcomes: list(/^What you will learn/i),
    prerequisites: list(/^Before you start/i),
    lessonDescriptions,
  };
}

// ─── Mux upload ──────────────────────────────────────────────────────────────

async function mux<T>(method: string, url: string, body?: unknown): Promise<T> {
  const id = process.env.MUX_ACCESS_TOKEN;
  const secret = process.env.MUX_SECRET_KEY;
  if (!id || !secret) throw new Error("--upload needs MUX_ACCESS_TOKEN and MUX_SECRET_KEY");
  const res = await fetch(`https://api.mux.com${url}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Mux ${method} ${url}: ${res.status} ${await res.text()}`);
  return ((await res.json()) as { data: T }).data;
}

async function uploadToMux(file: string, policy: "signed" | "public", passthrough: string): Promise<string> {
  const upload = await mux<{ id: string; url: string }>("POST", "/video/v1/uploads", {
    cors_origin: "*",
    new_asset_settings: { playback_policy: [policy], passthrough },
  });
  const put = await fetch(upload.url, {
    method: "PUT",
    headers: { "Content-Length": String(fs.statSync(file).size) },
    body: fs.readFileSync(file),
  });
  if (!put.ok) throw new Error(`Mux upload of ${file}: ${put.status}`);

  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const state = await mux<{ asset_id?: string; status: string }>("GET", `/video/v1/uploads/${upload.id}`);
    if (state.status === "errored" || state.status === "cancelled" || state.status === "timed_out") {
      throw new Error(`Mux upload of ${file}: ${state.status}`);
    }
    if (!state.asset_id) continue;
    const asset = await mux<{ status: string; playback_ids?: { id: string; policy: string }[] }>(
      "GET",
      `/video/v1/assets/${state.asset_id}`
    );
    if (asset.status === "errored") throw new Error(`Mux asset of ${file}: errored`);
    const playback = asset.playback_ids?.find((p) => p.policy === policy);
    if (asset.status === "ready" && playback) return playback.id;
  }
  throw new Error(`Mux upload of ${file}: not ready after 10 minutes`);
}

// ─── Import ──────────────────────────────────────────────────────────────────

const TRACKS = ["AI_AGENTS", "AI_HOMELAB", "FOUNDATIONS"];
const DIFFICULTIES = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

async function main() {
  const argv = process.argv.slice(2);
  const flag = (name: string) => argv.includes(name);
  const value = (name: string) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : undefined);
  const dir = argv.find((a, i) => !a.startsWith("--") && !["--track", "--difficulty"].includes(argv[i - 1]));
  if (!dir) {
    console.error("usage: pnpm course:import <package dir> [--track T] [--difficulty D] [--refresh] [--upload] [--dry-run]");
    process.exit(2);
  }
  const track = value("--track");
  const difficulty = value("--difficulty");
  if (track && !TRACKS.includes(track)) throw new Error(`--track must be one of ${TRACKS.join(", ")}`);
  if (difficulty && !DIFFICULTIES.includes(difficulty)) throw new Error(`--difficulty must be one of ${DIFFICULTIES.join(", ")}`);
  const dryRun = flag("--dry-run");

  const read = (name: string) => fs.readFileSync(path.join(dir, name), "utf8");
  const find = (suffix: string) => fs.readdirSync(dir).find((f) => f.endsWith(suffix));

  const { courseSlug, lessons } = parseManifest(read("manifest.csv"));
  const page = parseCoursePage(read("COURSE-PAGE.md"));
  lessons.forEach((l, i) => (l.description = page.lessonDescriptions[i] || null));
  for (const l of lessons) {
    if (!fs.existsSync(path.join(dir, l.file))) throw new Error(`video missing: ${l.file}`);
  }
  const faFile = find("-final-assessment.md");
  const assessment = faFile ? parseAssessmentMarkdown(read(faFile)) : null;
  // "Relevant Video: L2V5" must be a lesson of the package (module 2, video 5).
  for (const [i, q] of (assessment?.questions ?? []).entries()) {
    const m = q.relevantVideo?.match(/^L(\d+)V(\d+)$/i);
    const found = m && lessons.filter((l) => l.moduleNumber === Number(m[1]))[Number(m[2]) - 1];
    if (!found) console.warn(`WARN     assessment question ${i + 1}: relevant video ${q.relevantVideo ?? "(none)"} is not a lesson of this package`);
  }
  const labFile = find("-hands-on-lab.md");
  const labGuide = labFile ? read(labFile).trim() : null;
  const transcript = (l: PackageLesson) => {
    const f = path.join(dir, "subtitles", path.basename(l.file).replace(/\.[^.]+$/, ".txt"));
    return fs.existsSync(f) ? fs.readFileSync(f, "utf8").trim() : null;
  };
  const totalSeconds = lessons.reduce((s, l) => s + (l.durationSeconds ?? 0), 0);

  console.log(`Course   ${courseSlug}: ${page.title}`);
  console.log(`Lessons  ${lessons.length} (${Math.round(totalSeconds / 60)} min), modules: ${[...new Set(lessons.map((l) => l.moduleNumber ?? "-"))].join(", ")}`);
  console.log(`Extras   assessment: ${assessment ? `${assessment.questions.length} questions` : "none"}, hands-on lab: ${labGuide ? "yes" : "none"}, transcripts: ${lessons.filter((l) => transcript(l)).length}/${lessons.length}`);
  if (dryRun) {
    console.log("Dry run: nothing written.");
    return;
  }

  const prisma = new PrismaClient();
  try {
    const existing = await prisma.course.findUnique({ where: { slug: courseSlug } });
    const courseText = {
      title: page.title,
      description: page.description,
      outcomes: page.outcomes,
      prerequisites: page.prerequisites,
    };
    const always = {
      estimatedDuration: Math.round(totalSeconds / 60) || null,
      contentUpdatedAt: new Date(),
      ...(labGuide ? { labGuide } : {}),
      ...(track ? { track: track as CourseTrack } : {}),
      ...(difficulty ? { difficulty: difficulty as Difficulty } : {}),
    };
    let course;
    if (!existing) {
      const last = await prisma.course.aggregate({ _max: { sortOrder: true } });
      course = await prisma.course.create({
        data: {
          slug: courseSlug,
          ...courseText,
          ...always,
          difficulty: (difficulty as Difficulty) ?? "BEGINNER",
          status: "DRAFT",
          sortOrder: (last._max.sortOrder ?? 0) + 1,
        },
      });
      console.log("  ✓ course created (DRAFT)");
    } else {
      // A stub (no outcomes yet) or --refresh takes the package text.
      const takeText = flag("--refresh") || existing.outcomes.length === 0;
      course = await prisma.course.update({
        where: { id: existing.id },
        data: { ...(takeText ? courseText : {}), ...always },
      });
      console.log(`  ✓ course updated (${existing.status}${takeText ? ", text from the package" : ", text kept: use --refresh to replace it"})`);
    }

    for (const l of lessons) {
      const text = {
        title: l.title,
        description: l.description,
        sortOrder: l.sortOrder,
        moduleNumber: l.moduleNumber,
        durationSeconds: l.durationSeconds,
        transcript: transcript(l),
      };
      await prisma.lesson.upsert({
        where: { courseId_slug: { courseId: course.id, slug: l.slug } },
        update: text,
        create: { ...text, slug: l.slug, courseId: course.id, status: "DRAFT" },
      });
    }
    console.log(`  ✓ ${lessons.length} lessons`);

    if (assessment) {
      const data = { title: assessment.title, questions: assessment.questions as unknown as Prisma.InputJsonValue };
      await prisma.assessment.upsert({
        where: { courseId: course.id },
        update: data,
        create: { ...data, courseId: course.id },
      });
      console.log(`  ✓ final assessment (${assessment.questions.length} questions)`);
    }

    if (flag("--upload")) {
      const rows = await prisma.lesson.findMany({ where: { courseId: course.id }, select: { id: true, slug: true, videoPlaybackId: true } });
      for (const l of lessons) {
        const row = rows.find((r) => r.slug === l.slug)!;
        if (row.videoPlaybackId) {
          console.log(`  - ${l.slug}: video already set, skipped`);
          continue;
        }
        const playbackId = await uploadToMux(path.join(dir, l.file), "signed", `${courseSlug}/${l.slug}`);
        await prisma.lesson.update({ where: { id: row.id }, data: { videoPlaybackId: playbackId } });
        console.log(`  ✓ ${l.slug}: uploaded`);
      }
      const promo = path.join(dir, "videos", "promo.mp4");
      if (fs.existsSync(promo) && !course.trailerPlaybackId) {
        const playbackId = await uploadToMux(promo, "public", `${courseSlug}/promo`);
        await prisma.course.update({ where: { id: course.id }, data: { trailerPlaybackId: playbackId } });
        console.log("  ✓ promo uploaded");
      }
    }
    console.log("Done. Nothing was published: review the course in the admin, then set it to PUBLISHED.");
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  main().catch((e) => {
    console.error(`ERROR ${e instanceof Error ? e.message : e}`);
    process.exit(1);
  });
}
