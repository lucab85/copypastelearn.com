import yaml from "js-yaml";
import { labDefinitionSchema, type LabDefinitionInput } from "./schema.js";
import type { CompiledPlan } from "./types.js";

/**
 * Parse a YAML lab definition string and compile it into an execution plan.
 * Validates the YAML structure against the Zod schema.
 *
 * @throws Error if YAML is malformed or doesn't match the schema.
 */
export function compileLabDefinition(yamlSource: string): CompiledPlan {
  // Parse YAML to JS object
  const raw = yaml.load(yamlSource);

  if (!raw || typeof raw !== "object") {
    throw new CompilerError("Invalid YAML: expected an object", "INVALID_YAML");
  }

  // Validate against schema
  const result = labDefinitionSchema.safeParse(raw);

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new CompilerError(
      `Lab definition validation failed:\n${issues}`,
      "VALIDATION_FAILED"
    );
  }

  return transformToCompiledPlan(result.data);
}

function transformToCompiledPlan(input: LabDefinitionInput): CompiledPlan {
  return {
    metadata: {
      title: input.metadata.title,
      description: input.metadata.description,
      version: input.metadata.version,
      estimatedMinutes: input.metadata.estimatedMinutes,
    },
    environment: {
      image: input.environment.image,
      memoryLimit: input.environment.memoryLimit,
      cpuLimit: input.environment.cpuLimit,
      networkMode: input.environment.networkMode,
      env: input.environment.env,
      workingDir: input.environment.workingDir,
    },
    steps: input.steps.map((step, index) => ({
      index,
      title: step.title,
      instructions: step.instructions,
      checks: step.checks.map((check) => ({
        name: check.name,
        command: check.command,
        expected: check.expected,
        hint: check.hint,
        timeout: check.timeout,
      })),
    })),
  };
}

export class CompilerError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "CompilerError";
    this.code = code;
  }
}
