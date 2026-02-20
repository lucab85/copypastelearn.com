import { z } from "zod";

// ─── Lab Session Schemas ────────────────────────────────

export const createLabSessionSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  labDefinitionId: z.string().min(1, "labDefinitionId is required"),
  compiledPlan: z.record(z.unknown()),
  envConfig: z.object({
    image: z.string().min(1),
    memoryLimit: z.string().default("512m"),
    cpuLimit: z.string().default("1.0"),
    ttlMinutes: z.number().int().min(1).max(120).default(60),
    networkMode: z.string().default("internal"),
  }),
});

export type CreateLabSessionInput = z.infer<typeof createLabSessionSchema>;

export const validateStepSchema = z.object({
  stepIndex: z.number().int().min(0).optional(),
});

export type ValidateStepInput = z.infer<typeof validateStepSchema>;

// ─── Progress Schemas ───────────────────────────────────

export const saveVideoPositionSchema = z.object({
  lessonId: z.string().min(1, "lessonId is required"),
  positionSeconds: z.number().min(0),
});

export type SaveVideoPositionInput = z.infer<typeof saveVideoPositionSchema>;

export const markLessonCompleteSchema = z.object({
  lessonId: z.string().min(1, "lessonId is required"),
});

export type MarkLessonCompleteInput = z.infer<typeof markLessonCompleteSchema>;

// ─── Course Admin Schemas ───────────────────────────────

export const createCourseSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format"),
  description: z.string().min(1),
  outcomes: z.array(z.string()).default([]),
  prerequisites: z.array(z.string()).default([]),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  estimatedDuration: z.number().int().positive().optional(),
  thumbnailUrl: z.string().url().optional(),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;

export const updateCourseSchema = createCourseSchema.partial();
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;

export const createLessonSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format"),
  description: z.string().optional(),
  videoPlaybackId: z.string().optional(),
  transcript: z.string().optional(),
  codeSnippets: z
    .array(
      z.object({
        label: z.string(),
        language: z.string(),
        code: z.string(),
      })
    )
    .optional(),
  resources: z
    .array(
      z.object({
        title: z.string(),
        url: z.string().url(),
        type: z.string(),
      })
    )
    .optional(),
  sortOrder: z.number().int().min(0).default(0),
  durationSeconds: z.number().int().positive().optional(),
});

export type CreateLessonInput = z.infer<typeof createLessonSchema>;

export const updateLessonSchema = createLessonSchema.partial();
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
