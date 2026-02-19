"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

/**
 * Save the current video playback position (debounced on client).
 * Creates or updates LessonProgress.
 */
export async function saveVideoPosition(
  lessonId: string,
  positionSeconds: number
) {
  const user = await requireAuth();

  await db.lessonProgress.upsert({
    where: {
      userId_lessonId: { userId: user.id, lessonId },
    },
    create: {
      userId: user.id,
      lessonId,
      videoPositionSeconds: positionSeconds,
      lastAccessedAt: new Date(),
    },
    update: {
      videoPositionSeconds: positionSeconds,
      lastAccessedAt: new Date(),
    },
  });

  return { success: true };
}

/**
 * Mark a lesson as completed.
 * Recalculates the parent CourseProgress.percentComplete.
 */
export async function markLessonComplete(lessonId: string) {
  const user = await requireAuth();

  // Mark lesson complete
  await db.lessonProgress.upsert({
    where: {
      userId_lessonId: { userId: user.id, lessonId },
    },
    create: {
      userId: user.id,
      lessonId,
      completed: true,
      lastAccessedAt: new Date(),
    },
    update: {
      completed: true,
      lastAccessedAt: new Date(),
    },
  });

  // Get the lesson's course to recalculate progress
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: { courseId: true },
  });

  if (!lesson) return { success: true };

  // Count total published lessons and completed lessons
  const totalLessons = await db.lesson.count({
    where: { courseId: lesson.courseId, status: "PUBLISHED" },
  });

  const completedLessons = await db.lessonProgress.count({
    where: {
      userId: user.id,
      completed: true,
      lesson: { courseId: lesson.courseId, status: "PUBLISHED" },
    },
  });

  const percentComplete =
    totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  // Upsert course progress
  await db.courseProgress.upsert({
    where: {
      userId_courseId: { userId: user.id, courseId: lesson.courseId },
    },
    create: {
      userId: user.id,
      courseId: lesson.courseId,
      percentComplete,
      startedAt: new Date(),
      completedAt: percentComplete >= 100 ? new Date() : null,
    },
    update: {
      percentComplete,
      completedAt: percentComplete >= 100 ? new Date() : null,
    },
  });

  return { success: true, percentComplete };
}
