"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
  hint?: string | null;
}

interface ValidationFeedbackProps {
  checks: CheckResult[];
  passed: boolean;
  onRetry?: () => void;
  isValidating?: boolean;
  className?: string;
}

export function ValidationFeedback({
  checks,
  passed,
  onRetry,
  isValidating,
  className,
}: ValidationFeedbackProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Overall result */}
      <div
        role="alert"
        className={cn(
          "flex items-center gap-2 rounded-md border p-3",
          passed
            ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
            : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
        )}
      >
        {passed ? (
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        ) : (
          <XCircle className="h-5 w-5 text-red-600" />
        )}
        <span className="font-medium">
          {passed
            ? "All checks passed!"
            : `${checks.filter((c) => !c.passed).length} of ${checks.length} check(s) failed`}
        </span>
      </div>

      {/* Per-check results */}
      <ul className="space-y-2">
        {checks.map((check, idx) => (
          <li
            key={idx}
            className={cn(
              "flex items-start gap-2 rounded-md border px-3 py-2 text-sm",
              check.passed
                ? "border-green-100 bg-green-50/50 dark:border-green-900 dark:bg-green-950/50"
                : "border-red-100 bg-red-50/50 dark:border-red-900 dark:bg-red-950/50"
            )}
          >
            {check.passed ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
            ) : (
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            )}
            <div className="min-w-0">
              <p className="font-medium">{check.name}</p>
              <p className="text-muted-foreground">{check.message}</p>
              {!check.passed && check.hint && (
                <p className="mt-1 text-xs italic text-muted-foreground">
                  Hint: {check.hint}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Retry button */}
      {!passed && onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          disabled={isValidating}
          className="w-full"
        >
          {isValidating ? (
            <>
              <RotateCw className="mr-2 h-4 w-4 animate-spin" />
              Validating...
            </>
          ) : (
            <>
              <RotateCw className="mr-2 h-4 w-4" />
              Retry Validation
            </>
          )}
        </Button>
      )}
    </div>
  );
}
