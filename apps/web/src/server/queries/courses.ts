"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { CourseListItem, CourseDetail } from "@copypastelearn/shared";

/**
 * Get all published courses with lesson count and optional user progress.
 */
export async function getCourses(): Promise<CourseListItem[]> {
  const user = await getCurrentUser();

  const courses = await db.course.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { sortOrder: "asc" },
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

  return courses.map((course) => ({
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
}

/**
 * Get a single course by slug with ordered lessons.
 */
export async function getCourse(slug: string): Promise<CourseDetail | null> {
  const user = await getCurrentUser();

  const course = await db.course.findUnique({
    where: { slug, status: "PUBLISHED" },
    include: {
      lessons: {
        where: { status: "PUBLISHED" },
        orderBy: { sortOrder: "asc" },
        include: {
          labDefinition: { select: { id: true } },
          ...(user
            ? {
                lessonProgress: {
                  where: { userId: user.id },
                  select: {
                    completed: true,
                    videoPositionSeconds: true,
                  },
                },
              }
            : {}),
        },
      },
      ...(user
        ? {
            courseProgress: {
              where: { userId: user.id },
              select: {
                percentComplete: true,
                startedAt: true,
                completedAt: true,
              },
            },
          }
        : {}),
    },
  });

  if (!course) return null;

  // Determine subscription status for access gating
  let isSubscribed = false;
  if (user) {
    const subscription = await db.subscription.findUnique({
      where: { userId: user.id },
      select: { status: true },
    });
    isSubscribed = subscription?.status === "ACTIVE";
  }

  return {
    id: course.id,
    title: course.title,
    slug: course.slug,
    description: course.description,
    outcomes: course.outcomes,
    prerequisites: course.prerequisites,
    difficulty: course.difficulty,
    estimatedDuration: course.estimatedDuration,
    lessons: course.lessons.map((lesson) => {
      const isFree = lesson.sortOrder === 0;
      return {
        id: lesson.id,
        title: lesson.title,
        slug: lesson.slug,
        sortOrder: lesson.sortOrder,
        durationSeconds: lesson.durationSeconds,
        hasLab: !!lesson.labDefinition,
        isFree,
        isAccessible: isFree || isSubscribed,
        userProgress:
          "lessonProgress" in lesson &&
          Array.isArray(lesson.lessonProgress) &&
          lesson.lessonProgress.length > 0
            ? {
                completed: (lesson.lessonProgress as Array<{ completed: boolean; videoPositionSeconds: number }>)[0].completed,
                videoPositionSeconds: (lesson.lessonProgress as Array<{ completed: boolean; videoPositionSeconds: number }>)[0].videoPositionSeconds,
              }
            : null,
      };
    }),
    userProgress:
      "courseProgress" in course &&
      Array.isArray(course.courseProgress) &&
      course.courseProgress.length > 0
        ? {
            percentComplete: (course.courseProgress as Array<{ percentComplete: number; startedAt: Date; completedAt: Date | null }>)[0].percentComplete,
            startedAt: (course.courseProgress as Array<{ percentComplete: number; startedAt: Date; completedAt: Date | null }>)[0].startedAt.toISOString(),
            completedAt: (course.courseProgress as Array<{ percentComplete: number; startedAt: Date; completedAt: Date | null }>)[0].completedAt?.toISOString() ?? null,
          }
        : null,
  };
}
