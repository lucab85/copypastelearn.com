"use client";

import { useState, useEffect, useCallback } from "react";
import { TerminalView } from "./terminal-view";
import { ValidationFeedback } from "./validation-feedback";
import { LabStatusIndicator } from "./lab-status";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { validateLabStep, destroyLabSession } from "@/server/actions/labs";
import {
  FlaskConical,
  XCircle,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

type LabStatus =
  | "PROVISIONING"
  | "READY"
  | "RUNNING"
  | "VALIDATING"
  | "COMPLETED"
  | "EXPIRED"
  | "FAILED"
  | "DESTROYED";

interface LabStep {
  title: string;
  instructions: string;
}

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
  hint?: string | null;
}

interface LabPanelProps {
  sessionId: string;
  steps: LabStep[];
  initialStepIndex?: number;
  sseUrl: string;
  terminalWsUrl: string;
  className?: string;
}

export function LabPanel({
  sessionId,
  steps,
  initialStepIndex = 0,
  sseUrl,
  terminalWsUrl,
  className,
}: LabPanelProps) {
  const [status, setStatus] = useState<LabStatus>("PROVISIONING");
  const [currentStep, setCurrentStep] = useState(initialStepIndex);
  const [validationResult, setValidationResult] = useState<{
    passed: boolean;
    checks: CheckResult[];
  } | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [terminalConnected, setTerminalConnected] = useState(false);
  const [isDestroying, setIsDestroying] = useState(false);
  const [instructionsPanelOpen, setInstructionsPanelOpen] = useState(true);

  // SSE event stream
  useEffect(() => {
    const eventSource = new EventSource(sseUrl);

    eventSource.addEventListener("status", (event) => {
      const data = JSON.parse(event.data);
      setStatus(data.status as LabStatus);
      if (data.currentStepIndex !== undefined) {
        setCurrentStep(data.currentStepIndex);
      }
    });

    eventSource.addEventListener("step", (event) => {
      const data = JSON.parse(event.data);
      setCurrentStep(data.currentStepIndex);
      setValidationResult(null); // Clear validation on step change
    });

    eventSource.addEventListener("completed", () => {
      setStatus("COMPLETED");
    });

    eventSource.addEventListener("expired", () => {
      setStatus("EXPIRED");
    });

    eventSource.addEventListener("error", () => {
      // EventSource will auto-reconnect
    });

    return () => {
      eventSource.close();
    };
  }, [sseUrl]);

  const handleValidate = useCallback(async () => {
    setIsValidating(true);
    setValidationResult(null);

    const result = await validateLabStep(sessionId, currentStep);
    setIsValidating(false);

    if (result.data) {
      setValidationResult({
        passed: result.data.passed,
        checks: result.data.results,
      });
      if (result.data.passed && result.data.advancedToStep !== null) {
        setCurrentStep(result.data.advancedToStep);
      }
    } else if (result.error) {
      setValidationResult({
        passed: false,
        checks: [
          {
            name: "Error",
            passed: false,
            message: result.error,
          },
        ],
      });
    }
  }, [sessionId, currentStep]);

  const handleDestroy = useCallback(async () => {
    setIsDestroying(true);
    setStatus("DESTROYED");
    try {
      await destroyLabSession(sessionId);
    } catch {
      // Best-effort — UI already shows destroyed
    }
  }, [sessionId]);

  const step = steps[currentStep];
  const isTerminal = ["COMPLETED", "EXPIRED", "FAILED", "DESTROYED"].includes(
    status
  );

  return (
    <div
      role="region"
      aria-label="Interactive lab"
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-lg border",
        className
      )}
    >
      {/* Header */}
      <header className="flex items-center justify-between border-b bg-muted/50 px-4 py-2">
        <div className="flex items-center gap-3">
          <LabStatusIndicator status={status} />
          <span className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            aria-label={instructionsPanelOpen ? "Hide instructions" : "Show instructions"}
            onClick={() => setInstructionsPanelOpen(!instructionsPanelOpen)}
          >
            {instructionsPanelOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeftOpen className="h-4 w-4" />
            )}
          </Button>
          {!isTerminal && (
            <Button
              variant="ghost"
              size="sm"
              aria-label="End lab session"
              onClick={handleDestroy}
              disabled={isDestroying}
              className="text-destructive"
            >
              <XCircle className="mr-1 h-4 w-4" />
              {isDestroying ? "Ending..." : "End Lab"}
            </Button>
          )}
        </div>
      </header>

      {/* Split view */}
      <div className="flex flex-1 overflow-hidden">
        {/* Instructions panel */}
        {instructionsPanelOpen && (
          <aside aria-label="Lab instructions" className="w-80 shrink-0 space-y-4 overflow-y-auto border-r p-4">
            {step && (
              <>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <div
                  className="prose prose-sm dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: step.instructions }}
                />
              </>
            )}

            {/* Validate button */}
            {status === "RUNNING" && (
              <Button
                onClick={handleValidate}
                disabled={isValidating}
                className="w-full"
              >
                <FlaskConical className="mr-2 h-4 w-4" />
                {isValidating ? "Validating..." : "Validate Step"}
              </Button>
            )}

            {/* Validation feedback */}
            {validationResult && (
              <ValidationFeedback
                checks={validationResult.checks}
                passed={validationResult.passed}
                onRetry={handleValidate}
                isValidating={isValidating}
              />
            )}

            {/* Completion message */}
            {status === "COMPLETED" && (
              <div role="alert" className="rounded-md border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
                <p className="font-medium text-green-700 dark:text-green-300">
                  🎉 Lab completed!
                </p>
                <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                  You&apos;ve completed all steps successfully.
                </p>
              </div>
            )}
          </aside>
        )}

        {/* Terminal view */}
        <div className="flex-1">
          {["READY", "RUNNING", "VALIDATING"].includes(status) ? (
            <TerminalView
              websocketUrl={terminalWsUrl}
              onConnectionChange={setTerminalConnected}
              className="h-full rounded-none border-0"
            />
          ) : status === "PROVISIONING" ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="mt-4 text-sm text-muted-foreground">
                  Setting up your lab environment...
                </p>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground">
                Terminal session has ended.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
