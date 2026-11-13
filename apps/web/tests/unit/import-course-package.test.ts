import { describe, expect, it } from "vitest";
import { parseCoursePage, parseManifest } from "../../scripts/import-course-package";

const MANIFEST = `course_slug,sort_order,lesson_slug,lesson_title,file,duration_s,bytes,sha256_16,source
demo,1,second,"Second, with a comma",videos/02-second.mp4,284,1,abc,demo-m1l2
demo,0,first,First lesson,videos/01-first.mp4,240,1,abc,demo-m1l1
demo,2,third,Third lesson,videos/03-third.mp4,,1,abc,demo-m2l1
`;

const PAGE = `<!-- generated note -->
> **Read once before publishing.**

# Demo Course (Tool)

*One line subtitle*

First paragraph of the
description.

Second paragraph.

## What you will learn

- Outcome one
- Outcome two

## Before you start

- A Mac

## Lessons (3 videos)

### 01. M1L1: First lesson (04:00)

First lesson text.

Chapters:
\`\`\`
00:00 Start
\`\`\`

### 02. M1L2: Second (04:44)

Second lesson text.
`;

describe("parseManifest", () => {
  const { courseSlug, lessons } = parseManifest(MANIFEST);
  it("orders lessons and reads module, duration and quoted titles", () => {
    expect(courseSlug).toBe("demo");
    expect(lessons.map((l) => l.slug)).toEqual(["first", "second", "third"]);
    expect(lessons[1].title).toBe("Second, with a comma");
    expect(lessons.map((l) => l.moduleNumber)).toEqual([1, 1, 2]);
    expect(lessons[0].durationSeconds).toBe(240);
    expect(lessons[2].durationSeconds).toBeNull();
  });
  it("rejects two courses in one manifest", () => {
    expect(() => parseManifest(MANIFEST.replace("demo,2", "other,2"))).toThrow(/more than one/);
  });
});

describe("parseCoursePage", () => {
  const page = parseCoursePage(PAGE);
  it("reads title, description, lists and lesson texts, without generator notes", () => {
    expect(page.title).toBe("Demo Course (Tool)");
    expect(page.description).toBe("First paragraph of the description.\n\nSecond paragraph.");
    expect(page.outcomes).toEqual(["Outcome one", "Outcome two"]);
    expect(page.prerequisites).toEqual(["A Mac"]);
    expect(page.lessonDescriptions).toEqual(["First lesson text.", "Second lesson text."]);
  });
});
