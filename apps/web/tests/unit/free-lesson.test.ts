import { describe, expect, it } from "vitest";
import { freeLessonId } from "../../src/lib/free-lesson";

describe("freeLessonId", () => {
  it("is the lesson numbered 0 when the course starts at 0", () => {
    expect(freeLessonId([{ id: "a", sortOrder: 0 }, { id: "b", sortOrder: 1 }])).toBe("a");
  });
  it("is the first lesson when the course starts at 1", () => {
    expect(freeLessonId([{ id: "a", sortOrder: 1 }, { id: "b", sortOrder: 2 }])).toBe("a");
  });
  it("does not depend on the order of the list", () => {
    expect(freeLessonId([{ id: "c", sortOrder: 5 }, { id: "a", sortOrder: 2 }, { id: "b", sortOrder: 3 }])).toBe("a");
  });
  it("gives one free lesson only", () => {
    const lessons = [{ id: "a", sortOrder: 1 }, { id: "b", sortOrder: 2 }, { id: "c", sortOrder: 3 }];
    expect(lessons.filter((l) => freeLessonId(lessons) === l.id)).toHaveLength(1);
  });
  it("is null for a course with no published lesson", () => {
    expect(freeLessonId([])).toBeNull();
  });
});
