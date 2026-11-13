"use server";

import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import type {
  CourseListItem,
  CourseDetail,
  UpcomingCourse,
} from "@copypastelearn/shared";

/**
 * Public (no-auth) course catalog query, cached for ISR.
 * Used by marketing pages where user-specific data is not needed.
 */
export const getPublicCourses = unstable_cache(
  async (): Promise<CourseListItem[]> => {
    const courses = await db.course.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { lessons: { where: { status: "PUBLISHED" } } } },
      },
    });

    return courses.map((course) => ({
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      difficulty: course.difficulty,
      lessonCount: course._count.lessons,
      thumbnailUrl: course.thumbnailUrl?.trim() || null,
      userProgress: null,
      track: course.track,
    }));
  },
  ["public-courses-v4"],
  { revalidate: 3600, tags: ["courses"] }
);

/**
 * DRAFT courses that were announced: listed in the catalog as "coming soon"
 * with title and description only. They have no course page until PUBLISHED.
 */
export const getUpcomingCourses = unstable_cache(
  async (): Promise<UpcomingCourse[]> => {
    const courses = await db.course.findMany({
      where: { status: "DRAFT", announced: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        difficulty: true,
        track: true,
      },
    });
    return courses;
  },
  ["upcoming-courses-v1"],
  { revalidate: 3600, tags: ["courses"] }
);

/**
 * Public (no-auth) course detail query, cached for ISR.
 * Returns course data without user progress or subscription gating.
 * All lessons are listed; `isAccessible` marks only the first as free.
 */
export const getPublicCourse = unstable_cache(
  async (slug: string): Promise<CourseDetail | null> => {
    const course = await db.course.findUnique({
      where: { slug, status: "PUBLISHED" },
      include: {
        lessons: {
          where: { status: "PUBLISHED" },
          orderBy: { sortOrder: "asc" },
          include: {
            labDefinition: { select: { id: true } },
          },
        },
      },
    });

    if (!course) return null;

    return {
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      outcomes: course.outcomes,
      prerequisites: course.prerequisites,
      difficulty: course.difficulty,
      estimatedDuration: course.estimatedDuration,
      thumbnailUrl: course.thumbnailUrl?.trim() || null,
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
          isAccessible: isFree,
          userProgress: null,
        };
      }),
      userProgress: null,
    };
  },
  ["public-course-v3"],
  { revalidate: 3600, tags: ["courses"] }
);
