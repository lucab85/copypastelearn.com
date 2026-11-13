"use server";

import { db } from "@/lib/db";
import { getMemberAccess } from "@/server/queries/course-extras";
import {
  gradeAssessment,
  type AssessmentQuestion,
  type AssessmentResult,
} from "@/lib/assessment";

export interface RelevantLesson {
  title: string;
  slug: string;
}

export interface SubmitAssessmentResult {
  ok: boolean;
  error?: string;
  result?: AssessmentResult;
  /** Lesson to watch again, by question index (from "L<module>V<video>"). */
  relevantLessons?: (RelevantLesson | null)[];
}

/**
 * Grade a final assessment on the server and record the attempt.
 * The correct answers and explanations are returned only here, after grading.
 */
export async function submitAssessment(
  courseSlug: string,
  answers: (string | null)[]
): Promise<SubmitAssessmentResult> {
  const { access, userId } = await getMemberAccess();
  if (access !== "ok") {
    return { ok: false, error: "An active subscription is required." };
  }

  const course = await db.course.findUnique({
    where: { slug: courseSlug, status: "PUBLISHED" },
    select: {
      assessment: true,
      lessons: {
        where: { status: "PUBLISHED" },
        orderBy: { sortOrder: "asc" },
        select: { title: true, slug: true, moduleNumber: true },
      },
    },
  });
  if (!course?.assessment) return { ok: false, error: "Assessment not found." };

  const questions = course.assessment.questions as unknown as AssessmentQuestion[];
  if (!Array.isArray(answers) || answers.length > questions.length) {
    return { ok: false, error: "Invalid answers." };
  }
  const clean = questions.map((q, i) => {
    const a = answers[i];
    return typeof a === "string" && q.options.some((o) => o.key === a) ? a : null;
  });
  const result = gradeAssessment(questions, clean, course.assessment.passPercent);

  if (userId) {
    await db.assessmentAttempt.create({
      data: {
        assessmentId: course.assessment.id,
        userId,
        score: result.score,
        total: result.total,
        passed: result.passed,
        answers: clean,
      },
    });
  }

  const relevantLessons = questions.map((q) => {
    const m = q.relevantVideo?.match(/^L(\d+)V(\d+)$/i);
    if (!m) return null;
    const inModule = course.lessons.filter((l) => l.moduleNumber === Number(m[1]));
    const lesson = inModule[Number(m[2]) - 1];
    return lesson ? { title: lesson.title, slug: lesson.slug } : null;
  });

  return { ok: true, result, relevantLessons };
}
