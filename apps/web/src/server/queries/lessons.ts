"use server";

import { db } from "@/lib/db";
import { getCurrentUser, NotFoundError, ForbiddenError } from "@/lib/auth";
import type { LessonDetail } from "@copypastelearn/shared";

/**
 * Get a single lesson with full content.
 * Free lessons (sortOrder === 0) are accessible without authentication.
 * All others require an active subscription.
 */
export async function getLesson(
  courseSlug: string,
  lessonSlug: string
): Promise<LessonDetail> {
  const user = await getCurrentUser();

  const lesson = await db.lesson.findFirst({
    where: {
      slug: lessonSlug,
      course: { slug: courseSlug, status: "PUBLISHED" },
      status: "PUBLISHED",
    },
    include: {
      course: {
        select: {
          id: true,
          slug: true,
          lessons: {
            where: { status: "PUBLISHED" },
            orderBy: { sortOrder: "asc" },
            select: { id: true, slug: true, title: true, sortOrder: true },
          },
        },
      },
      labDefinition: { select: { id: true } },
      lessonProgress: user
        ? {
            where: { userId: user.id },
            select: {
              videoPositionSeconds: true,
              completed: true,
              lastAccessedAt: true,
            },
          }
        : false,
    },
  });

  if (!lesson) {
    throw new NotFoundError("Lesson not found");
  }

  // Subscription gating: first lesson is free, others require auth + subscription
  const isFree = lesson.sortOrder === 0;
  if (!isFree) {
    if (!user) {
      throw new ForbiddenError(
        "Sign in to access this lesson"
      );
    }

    const subscription = await db.subscription.findUnique({
      where: { userId: user.id },
      select: { status: true },
    });

    if (subscription?.status !== "ACTIVE") {
      throw new ForbiddenError(
        "An active subscription is required to access this lesson"
      );
    }
  }

  // Find next/previous lessons in the course
  const orderedLessons = lesson.course.lessons;
  const currentIndex = orderedLessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = currentIndex > 0 ? orderedLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < orderedLessons.length - 1
      ? orderedLessons[currentIndex + 1]
      : null;

  // Track progress for authenticated users
  if (user) {
    await db.lessonProgress.upsert({
      where: {
        userId_lessonId: { userId: user.id, lessonId: lesson.id },
      },
      create: {
        userId: user.id,
        lessonId: lesson.id,
        lastAccessedAt: new Date(),
      },
      update: {
        lastAccessedAt: new Date(),
      },
    });

    // Ensure CourseProgress exists (creates on first lesson access)
    await db.courseProgress.upsert({
      where: {
        userId_courseId: { userId: user.id, courseId: lesson.course.id },
      },
      create: {
        userId: user.id,
        courseId: lesson.course.id,
        percentComplete: 0,
        startedAt: new Date(),
      },
      update: {}, // no-op if already exists
    });
  }

  const progressList = Array.isArray(lesson.lessonProgress)
    ? lesson.lessonProgress
    : [];
  const progress = progressList[0] ?? null;

  return {
    id: lesson.id,
    title: lesson.title,
    courseSlug: lesson.course.slug,
    videoPlaybackId: lesson.videoPlaybackId,
    transcript: lesson.transcript,
    codeSnippets: lesson.codeSnippets as LessonDetail["codeSnippets"],
    resources: lesson.resources as LessonDetail["resources"],
    labDefinitionId: lesson.labDefinition?.id ?? null,
    userProgress: progress
      ? {
          videoPositionSeconds: progress.videoPositionSeconds,
          completed: progress.completed,
          lastAccessedAt: progress.lastAccessedAt.toISOString(),
        }
      : null,
    nextLesson: nextLesson
      ? { slug: nextLesson.slug, title: nextLesson.title }
      : null,
    previousLesson: prevLesson
      ? { slug: prevLesson.slug, title: prevLesson.title }
      : null,
  };
}
