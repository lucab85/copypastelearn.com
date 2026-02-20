"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TranscriptPanelProps {
  transcript: string;
}

export function TranscriptPanel({ transcript }: TranscriptPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-lg border">
      <Button
        variant="ghost"
        className="flex w-full items-center justify-between p-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="font-semibold">Transcript</span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>
      {isExpanded && (
        <div className="max-h-96 overflow-y-auto border-t px-4 py-3">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {transcript}
          </p>
        </div>
      )}
    </div>
  );
}
