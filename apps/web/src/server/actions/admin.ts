"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  createCourseSchema,
  updateCourseSchema,
  createLessonSchema,
  updateLessonSchema,
} from "@copypastelearn/shared";

// ─── Course Actions ───────────────────────────────────

export async function createCourse(data: unknown) {
  await requireAdmin();
  const input = createCourseSchema.parse(data);

  const course = await db.course.create({
    data: {
      ...input,
      slug: slugify(input.title),
      status: "DRAFT",
    },
  });

  return { data: course };
}

export async function updateCourse(id: string, data: unknown) {
  await requireAdmin();
  const input = updateCourseSchema.parse(data);

  const course = await db.course.update({
    where: { id },
    data: input,
  });

  return { data: course };
}

export async function publishCourse(id: string) {
  await requireAdmin();

  // Verify course has at least one published lesson
  const lessonCount = await db.lesson.count({
    where: { courseId: id, status: "PUBLISHED" },
  });

  if (lessonCount === 0) {
    return { error: "Course must have at least one published lesson" };
  }

  const course = await db.course.update({
    where: { id },
    data: { status: "PUBLISHED" },
    include: { _count: true },
  });

  revalidatePath("/courses", "page");
  revalidatePath(`/courses/${course.slug}`, "page");

  return { data: course };
}

export async function unpublishCourse(id: string) {
  await requireAdmin();

  const course = await db.course.update({
    where: { id },
    data: { status: "DRAFT" },
  });

  revalidatePath("/courses", "page");
  revalidatePath(`/courses/${course.slug}`, "page");

  return { data: course };
}

export async function deleteCourse(id: string) {
  await requireAdmin();

  await db.course.delete({ where: { id } });
  revalidatePath("/courses", "page");

  return { success: true };
}

// ─── Lesson Actions ───────────────────────────────────

export async function createLesson(courseId: string, data: unknown) {
  await requireAdmin();
  const input = createLessonSchema.parse(data);

  // Get next sort order
  const lastLesson = await db.lesson.findFirst({
    where: { courseId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const nextSortOrder = (lastLesson?.sortOrder ?? -1) + 1;

  const lesson = await db.lesson.create({
    data: {
      ...input,
      courseId,
      slug: slugify(input.title),
      sortOrder: nextSortOrder,
      status: "DRAFT",
    },
  });

  return { data: lesson };
}

export async function updateLesson(id: string, data: unknown) {
  await requireAdmin();
  const input = updateLessonSchema.parse(data);

  const lesson = await db.lesson.update({
    where: { id },
    data: input,
  });

  return { data: lesson };
}

export async function publishLesson(id: string) {
  await requireAdmin();

  const lesson = await db.lesson.update({
    where: { id },
    data: { status: "PUBLISHED" },
    include: { course: { select: { slug: true } } },
  });

  revalidatePath("/courses", "page");
  revalidatePath(`/courses/${lesson.course.slug}`, "page");

  return { data: lesson };
}

export async function unpublishLesson(id: string) {
  await requireAdmin();

  const lesson = await db.lesson.update({
    where: { id },
    data: { status: "DRAFT" },
    include: { course: { select: { slug: true } } },
  });

  revalidatePath("/courses", "page");
  revalidatePath(`/courses/${lesson.course.slug}`, "page");

  return { data: lesson };
}

export async function reorderLessons(
  courseId: string,
  lessonIds: string[]
) {
  await requireAdmin();

  await db.$transaction(
    lessonIds.map((id, index) =>
      db.lesson.update({
        where: { id },
        data: { sortOrder: index },
      })
    )
  );

  return { success: true };
}

// ─── Lab Definition Actions ───────────────────────────

export async function upsertLabDefinition(
  lessonId: string,
  data: {
    title: string;
    description: string | null;
    yamlConfig: string;
    dockerImage: string;
    memoryLimit: string | null;
    cpuLimit: string | null;
  }
) {
  await requireAdmin();

  // Map form fields to Prisma schema fields
  const compiledPlan = {
    title: data.title,
    description: data.description,
    dockerImage: data.dockerImage,
    memoryLimit: data.memoryLimit ?? "256m",
    cpuLimit: data.cpuLimit ?? "0.5",
  };

  const envConfig = {
    image: data.dockerImage,
    memoryLimit: data.memoryLimit ?? "256m",
    cpuLimit: data.cpuLimit ?? "0.5",
  };

  const prismaData = {
    yamlSource: data.yamlConfig,
    compiledPlan,
    envConfig,
  };

  const existing = await db.labDefinition.findUnique({
    where: { lessonId },
  });

  if (existing) {
    const labDef = await db.labDefinition.update({
      where: { lessonId },
      data: prismaData,
    });
    return { data: labDef };
  }

  const labDef = await db.labDefinition.create({
    data: { ...prismaData, lessonId },
  });

  return { data: labDef };
}

// ─── Lab Session Admin Actions ────────────────────────

export async function getAdminLabSessions() {
  await requireAdmin();

  const sessions = await db.labSession.findMany({
    where: {
      status: { in: ["PROVISIONING", "READY", "RUNNING", "VALIDATING"] },
    },
    include: {
      user: { select: { email: true, displayName: true } },
      labDefinition: { select: { compiledPlan: true } },
    },
    orderBy: { startedAt: "desc" },
  });

  return sessions.map((s) => {
    const plan = s.labDefinition.compiledPlan as Record<string, unknown> | null;
    return {
      id: s.id,
      userId: s.userId,
      userEmail: s.user.email,
      userName: s.user.displayName,
      labTitle: (plan?.title as string) ?? "Lab",
      status: s.status,
      expiresAt: s.expiresAt.toISOString(),
      startedAt: s.startedAt.toISOString(),
    };
  });
}

export async function adminDestroyLabSession(sessionId: string) {
  await requireAdmin();

  // Import lab client at runtime to avoid circular deps
  const { destroySession } = await import("@/lib/lab-client");

  try {
    await destroySession(sessionId);
  } catch {
    // Lab service may be down, still update DB
  }

  await db.labSession.update({
    where: { id: sessionId },
    data: { status: "DESTROYED", destroyedAt: new Date() },
  });

  return { success: true };
}

// ─── Helpers ──────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}
