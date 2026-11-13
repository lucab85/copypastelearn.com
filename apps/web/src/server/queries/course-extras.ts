"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  toPublicQuestions,
  type AssessmentQuestion,
  type PublicQuestion,
} from "@/lib/assessment";

export type MemberAccess = "ok" | "signed-out" | "no-subscription";

/**
 * Access to subscriber-only course material (final assessment, hands-on lab):
 * the same rule as a non-free lesson, an ACTIVE subscription.
 *
 * Local preview only: `next dev` with no Clerk key has no way to sign in, so
 * the material is shown there (never in a production build).
 */
export async function getMemberAccess(): Promise<{
  access: MemberAccess;
  userId: string | null;
}> {
  if (
    process.env.NODE_ENV === "development" &&
    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  ) {
    return { access: "ok", userId: null };
  }
  const user = await getCurrentUser();
  if (!user) return { access: "signed-out", userId: null };
  const subscription = await db.subscription.findUnique({
    where: { userId: user.id },
    select: { status: true },
  });
  return {
    access: subscription?.status === "ACTIVE" ? "ok" : "no-subscription",
    userId: user.id,
  };
}

export interface CourseAssessmentView {
  courseTitle: string;
  title: string;
  passPercent: number;
  questionCount: number;
  access: MemberAccess;
  /** Empty unless access is "ok". Never contains the answers. */
  questions: PublicQuestion[];
  bestAttempt: { score: number; total: number; passed: boolean } | null;
}

export async function getCourseAssessment(
  slug: string
): Promise<CourseAssessmentView | null> {
  const course = await db.course.findUnique({
    where: { slug, status: "PUBLISHED" },
    select: { title: true, assessment: true },
  });
  if (!course?.assessment) return null;

  const { access, userId } = await getMemberAccess();
  const questions = course.assessment.questions as unknown as AssessmentQuestion[];
  const best =
    access === "ok" && userId
      ? await db.assessmentAttempt.findFirst({
          where: { userId, assessmentId: course.assessment.id },
          orderBy: [{ score: "desc" }, { createdAt: "desc" }],
          select: { score: true, total: true, passed: true },
        })
      : null;

  return {
    courseTitle: course.title,
    title: course.assessment.title,
    passPercent: course.assessment.passPercent,
    questionCount: questions.length,
    access,
    questions: access === "ok" ? toPublicQuestions(questions) : [],
    bestAttempt: best,
  };
}

export interface CourseLabGuideView {
  courseTitle: string;
  access: MemberAccess;
  /** Markdown; null unless access is "ok". */
  labGuide: string | null;
}

export async function getCourseLabGuide(
  slug: string
): Promise<CourseLabGuideView | null> {
  const course = await db.course.findUnique({
    where: { slug, status: "PUBLISHED" },
    select: { title: true, labGuide: true },
  });
  if (!course?.labGuide) return null;
  const { access } = await getMemberAccess();
  return {
    courseTitle: course.title,
    access,
    labGuide: access === "ok" ? course.labGuide : null,
  };
}
