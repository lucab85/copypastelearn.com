"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import type { DashboardData } from "@copypastelearn/shared";

export async function getDashboard(): Promise<DashboardData> {
  const user = await requireAuth();

  // In-progress courses
  const courseProgress = await db.courseProgress.findMany({
    where: { userId: user.id },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnailUrl: true,
          lessons: {
            where: { status: "PUBLISHED" },
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              title: true,
              slug: true,
              sortOrder: true,
              lessonProgress: {
                where: { userId: user.id },
                select: { completed: true },
              },
            },
          },
        },
      },
    },
    orderBy: { lastActivityAt: "desc" },
  });

  const courses = courseProgress.map((cp) => {
    // Find the next incomplete lesson
    const nextLesson = cp.course.lessons.find(
      (l) => !l.lessonProgress[0]?.completed
    );

    return {
      courseId: cp.course.id,
      title: cp.course.title,
      slug: cp.course.slug,
      thumbnailUrl: cp.course.thumbnailUrl,
      percentComplete: cp.percentComplete,
      completedAt: cp.completedAt?.toISOString() ?? null,
      nextLesson: nextLesson
        ? { slug: nextLesson.slug, title: nextLesson.title }
        : null,
    };
  });

  // Recent lessons
  const recentLessons = await db.lessonProgress.findMany({
    where: { userId: user.id },
    orderBy: { lastAccessedAt: "desc" },
    take: 5,
    include: {
      lesson: {
        select: {
          id: true,
          title: true,
          slug: true,
          course: {
            select: {
              slug: true,
              title: true,
            },
          },
        },
      },
    },
  });

  // Active lab session
  const activeLabSession = await db.labSession.findFirst({
    where: {
      userId: user.id,
      status: { in: ["PROVISIONING", "READY", "RUNNING", "VALIDATING"] },
    },
    include: {
      labDefinition: {
        select: {
          title: true,
          lesson: {
            select: {
              slug: true,
              course: { select: { slug: true } },
            },
          },
        },
      },
    },
    orderBy: { startedAt: "desc" },
  });

  return {
    inProgressCourses: courses.filter((c) => !c.completedAt),
    completedCourses: courses.filter((c) => !!c.completedAt),
    recentLessons: recentLessons.map((lp) => ({
      lessonId: lp.lesson.id,
      title: lp.lesson.title,
      slug: lp.lesson.slug,
      courseSlug: lp.lesson.course.slug,
      courseTitle: lp.lesson.course.title,
      lastAccessedAt: lp.lastAccessedAt.toISOString(),
      completed: lp.completed,
    })),
    activeLabSession: activeLabSession
      ? {
          sessionId: activeLabSession.id,
          labTitle: activeLabSession.labDefinition.title,
          status: activeLabSession.status,
          expiresAt: activeLabSession.expiresAt.toISOString(),
        }
      : null,
  };
}
