/**
 * Compiled execution plan — the runtime representation of a lab definition
 * after YAML parsing and schema validation.
 */
export interface CompiledPlan {
  metadata: PlanMetadata;
  environment: EnvironmentConfig;
  steps: PlanStep[];
}

export interface PlanMetadata {
  title: string;
  description?: string;
  version: number;
  estimatedMinutes?: number;
}

export interface EnvironmentConfig {
  image: string;
  memoryLimit: string;
  cpuLimit: string;
  networkMode: string;
  env?: Record<string, string>;
  workingDir?: string;
}

export interface PlanStep {
  index: number;
  title: string;
  instructions: string;
  checks: PlanCheck[];
}

export interface PlanCheck {
  name: string;
  command: string;
  expected: string;
  hint?: string;
  timeout?: number; // milliseconds
}
