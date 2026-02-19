"use server";

import { db } from "@/lib/db";
import { requireAuth, NotFoundError, ForbiddenError } from "@/lib/auth";
import type { LessonDetail } from "@copypastelearn/shared";

/**
 * Get a single lesson with full content.
 * Enforces subscription gating: first lesson (sortOrder === 0) is free,
 * all others require an active subscription.
 */
export async function getLesson(
  courseSlug: string,
  lessonSlug: string
): Promise<LessonDetail> {
  const user = await requireAuth();

  const lesson = await db.lesson.findFirst({
    where: {
      slug: lessonSlug,
      course: { slug: courseSlug, status: "PUBLISHED" },
      status: "PUBLISHED",
    },
    include: {
      course: {
        select: {
          slug: true,
          lessons: {
            where: { status: "PUBLISHED" },
            orderBy: { sortOrder: "asc" },
            select: { id: true, slug: true, title: true, sortOrder: true },
          },
        },
      },
      labDefinition: { select: { id: true } },
      lessonProgress: {
        where: { userId: user.id },
        select: {
          videoPositionSeconds: true,
          completed: true,
          lastAccessedAt: true,
        },
      },
    },
  });

  if (!lesson) {
    throw new NotFoundError("Lesson not found");
  }

  // Subscription gating: first lesson is free, others require subscription
  const isFree = lesson.sortOrder === 0;
  if (!isFree) {
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

  // Update lastAccessedAt
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

  const progress = lesson.lessonProgress[0] ?? null;

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
