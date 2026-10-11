"use client";

import { useId, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackTranscriptToggle } from "@/lib/analytics";

interface TranscriptPanelProps {
  transcript: string;
}

export function TranscriptPanel({ transcript }: TranscriptPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const panelId = useId();

  return (
    <div className="rounded-lg border">
      <Button
        variant="ghost"
        className="flex w-full items-center justify-between p-4"
        aria-expanded={isExpanded}
        aria-controls={panelId}
        onClick={() => {
          trackTranscriptToggle(isExpanded ? "close" : "open");
          setIsExpanded(!isExpanded);
        }}
      >
        <span className="font-semibold">Transcript</span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>
      {/* Always server-render the transcript and collapse it with `hidden`, so
          the text is in the initial HTML for crawlers instead of only being
          mounted client-side after the toggle is clicked. */}
      <div
        id={panelId}
        hidden={!isExpanded}
        className="max-h-96 overflow-y-auto border-t px-4 py-3"
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {transcript}
        </p>
      </div>
    </div>
  );
}
