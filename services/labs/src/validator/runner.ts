import type { ContainerProvider } from "../orchestrator/interface.js";
import type { PlanCheck } from "../compiler/types.js";
import type { ValidationResult, CheckResult } from "./types.js";
import { sanitizeOutput } from "./sanitizer.js";
import { logger } from "../logger.js";

/**
 * Execute validation checks for a given step inside the container.
 * Returns structured results with pass/fail per check.
 */
export async function runValidation(
  provider: ContainerProvider,
  containerId: string,
  stepIndex: number,
  checks: PlanCheck[],
  totalSteps: number
): Promise<ValidationResult> {
  const log = logger.child({ containerId, stepIndex });
  log.info({ checkCount: checks.length }, "Running validation");

  const results: CheckResult[] = [];
  let allPassed = true;

  for (const check of checks) {
    try {
      const execResult = await provider.exec(
        containerId,
        ["sh", "-c", check.command],
        { timeout: check.timeout ?? 10000 }
      );

      const sanitizedOutput = sanitizeOutput(execResult.stdout);
      const passed =
        execResult.exitCode === 0 &&
        sanitizedOutput.includes(check.expected);

      if (!passed) allPassed = false;

      results.push({
        checkName: check.name,
        passed,
        message: passed
          ? `Check "${check.name}" passed`
          : `Check "${check.name}" failed: expected output containing "${check.expected}"`,
        hint: passed ? null : (check.hint ?? null),
      });

      log.debug(
        { checkName: check.name, passed, exitCode: execResult.exitCode },
        "Check completed"
      );
    } catch (error) {
      allPassed = false;
      results.push({
        checkName: check.name,
        passed: false,
        message: `Check "${check.name}" failed: execution error`,
        hint: check.hint ?? null,
      });
      log.error({ checkName: check.name, error }, "Check execution failed");
    }
  }

  // If all checks passed and there's a next step, advance
  const isLastStep = stepIndex >= totalSteps - 1;
  const advancedToStep = allPassed && !isLastStep ? stepIndex + 1 : null;

  log.info(
    { allPassed, advancedToStep, isLastStep },
    "Validation complete"
  );

  return {
    stepIndex,
    passed: allPassed,
    results,
    advancedToStep,
  };
}
