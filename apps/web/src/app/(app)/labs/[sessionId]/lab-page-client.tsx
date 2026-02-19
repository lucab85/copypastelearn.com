"use client";

import Link from "next/link";
import { LabPanel } from "@/components/lab/lab-panel";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Maximize2, Minimize2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface LabPageClientProps {
  sessionId: string;
  labTitle: string;
  steps: { title: string; instructions: string }[];
  currentStepIndex: number;
  backUrl: string;
}

export function LabPageClient({
  sessionId,
  labTitle,
  steps,
  currentStepIndex,
  backUrl,
}: LabPageClientProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div
      className={cn(
        "flex flex-col",
        isFullscreen ? "fixed inset-0 z-50 bg-background" : "h-[calc(100vh-4rem)]"
      )}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href={backUrl}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Link>
          </Button>
          <span className="text-sm font-medium">{labTitle}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          onClick={() => setIsFullscreen(!isFullscreen)}
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Lab panel fills remaining space */}
      <LabPanel
        sessionId={sessionId}
        steps={steps}
        initialStepIndex={currentStepIndex}
        className="flex-1 rounded-none border-0"
      />
    </div>
  );
}
