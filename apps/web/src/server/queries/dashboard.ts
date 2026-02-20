"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import type { DashboardData } from "@copypastelearn/shared";

export interface DashboardResult extends DashboardData {
  userName: string | null;
  totalLessonsCompleted: number;
}

export async function getDashboard(): Promise<DashboardResult> {
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
    orderBy: { startedAt: "desc" },
  });

  const courses = courseProgress.map((cp: any) => {
    // Find the next incomplete lesson
    const nextLesson = cp.course.lessons.find(
      (l: any) => !l.lessonProgress[0]?.completed
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

  // Total completed lessons
  const totalLessonsCompleted = await db.lessonProgress.count({
    where: { userId: user.id, completed: true },
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
          lesson: {
            select: {
              title: true,
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
    userName: user.displayName,
    totalLessonsCompleted,
    inProgressCourses: courses.filter((c: any) => !c.completedAt),
    completedCourses: courses.filter((c: any) => !!c.completedAt),
    recentLessons: recentLessons.map((lp: any) => ({
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
          labTitle: activeLabSession.labDefinition.lesson.title,
          status: activeLabSession.status,
          expiresAt: activeLabSession.expiresAt.toISOString(),
        }
      : null,
  };
}
