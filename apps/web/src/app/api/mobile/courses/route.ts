import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "../_lib/auth";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor") ?? undefined;
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 1), 50);

    const user = await getCurrentUser();

    const courses = await db.course.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { sortOrder: "asc" },
      take: limit + 1, // fetch one extra to determine if there's a next page
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        _count: { select: { lessons: { where: { status: "PUBLISHED" } } } },
        ...(user
          ? {
              courseProgress: {
                where: { userId: user.id },
                select: { percentComplete: true },
              },
            }
          : {}),
      },
    });

    const hasMore = courses.length > limit;
    const items = hasMore ? courses.slice(0, limit) : courses;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    const data = items.map((course) => ({
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      difficulty: course.difficulty,
      lessonCount: course._count.lessons,
      thumbnailUrl: course.thumbnailUrl,
      userProgress:
        "courseProgress" in course &&
        Array.isArray(course.courseProgress) &&
        course.courseProgress.length > 0
          ? { percentComplete: (course.courseProgress as Array<{ percentComplete: number }>)[0].percentComplete }
          : null,
    }));

    return NextResponse.json({ success: true, data, nextCursor });
  });
}
