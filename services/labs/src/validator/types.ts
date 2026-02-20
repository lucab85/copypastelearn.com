/**
 * Validation result types for lab step validation.
 */
export interface ValidationResult {
  stepIndex: number;
  passed: boolean;
  results: CheckResult[];
  advancedToStep: number | null;
}

export interface CheckResult {
  checkName: string;
  passed: boolean;
  message: string;
  hint?: string | null;
}

/**
 * Internal check execution context passed to the runner.
 */
export interface CheckContext {
  containerId: string;
  stepIndex: number;
  timeout: number;
}
