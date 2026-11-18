import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Course.publishedAt is set the first time a course is published and is
 * never overwritten: not by publishing again, not by unpublishing.
 */

vi.mock("@/lib/auth", () => ({ requireAdmin: vi.fn(async () => ({ role: "ADMIN" })) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("@/lib/indexnow", () => ({ submitToIndexNow: vi.fn() }));

const lessonCount = vi.fn();
const courseUpdateMany = vi.fn();
const courseUpdate = vi.fn();
vi.mock("@/lib/db", () => ({
  db: {
    lesson: { count: (args: unknown) => lessonCount(args) },
    course: {
      updateMany: (args: unknown) => courseUpdateMany(args),
      update: (args: unknown) => courseUpdate(args),
    },
  },
}));

import { publishCourse, unpublishCourse } from "@/server/actions/admin";

beforeEach(() => {
  lessonCount.mockReset();
  courseUpdateMany.mockReset().mockResolvedValue({ count: 1 });
  courseUpdate.mockReset().mockResolvedValue({ id: "c1", slug: "demo" });
});

describe("publishCourse", () => {
  it("sets the publish date only where it is still empty, then publishes", async () => {
    lessonCount.mockResolvedValue(3);
    const before = Date.now();
    await publishCourse("c1");

    expect(courseUpdateMany).toHaveBeenCalledTimes(1);
    const dated = courseUpdateMany.mock.calls[0][0];
    expect(dated.where).toEqual({ id: "c1", publishedAt: null });
    expect(dated.data.publishedAt).toBeInstanceOf(Date);
    expect(dated.data.publishedAt.getTime()).toBeGreaterThanOrEqual(before);

    // The status change itself never carries a date, so it cannot overwrite one.
    expect(courseUpdate.mock.calls[0][0].data).toEqual({ status: "PUBLISHED" });
    expect(courseUpdateMany.mock.invocationCallOrder[0]).toBeLessThan(
      courseUpdate.mock.invocationCallOrder[0]
    );
  });

  it("writes nothing when the course has no published lesson", async () => {
    lessonCount.mockResolvedValue(0);
    const result = await publishCourse("c1");
    expect(result).toHaveProperty("error");
    expect(courseUpdateMany).not.toHaveBeenCalled();
    expect(courseUpdate).not.toHaveBeenCalled();
  });
});

describe("unpublishCourse", () => {
  it("keeps the publish date", async () => {
    await unpublishCourse("c1");
    expect(courseUpdateMany).not.toHaveBeenCalled();
    expect(courseUpdate.mock.calls[0][0].data).toEqual({ status: "DRAFT" });
  });
});
