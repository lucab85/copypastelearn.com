import { z } from "zod";

/**
 * Zod schema for validating lab definition YAML files.
 * Ensures well-formed lab definitions at compile time.
 */
export const labCheckSchema = z.object({
  name: z.string().min(1, "Check name is required"),
  command: z.string().min(1, "Check command is required"),
  expected: z.string().min(1, "Expected output is required"),
  hint: z.string().optional(),
  timeout: z.number().int().positive().optional().default(10000),
});

export const labStepSchema = z.object({
  title: z.string().min(1, "Step title is required"),
  instructions: z.string().min(1, "Step instructions are required"),
  checks: z.array(labCheckSchema).min(1, "At least one check is required"),
});

export const labEnvironmentSchema = z.object({
  image: z.string().min(1, "Container image is required"),
  memoryLimit: z.string().default("512m"),
  cpuLimit: z.string().default("1.0"),
  networkMode: z.string().default("none"),
  env: z.record(z.string()).optional(),
  workingDir: z.string().optional(),
});

export const labDefinitionSchema = z.object({
  metadata: z.object({
    title: z.string().min(1, "Lab title is required"),
    description: z.string().optional(),
    version: z.number().int().positive().default(1),
    estimatedMinutes: z.number().int().positive().optional(),
  }),
  environment: labEnvironmentSchema,
  steps: z.array(labStepSchema).min(1, "At least one step is required"),
});

export type LabDefinitionInput = z.infer<typeof labDefinitionSchema>;
