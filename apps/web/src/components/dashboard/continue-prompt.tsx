"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Play, ArrowRight } from "lucide-react";

interface ContinuePromptProps {
  lessonTitle: string;
  lessonSlug: string;
  courseTitle: string;
  courseSlug: string;
  className?: string;
}

export function ContinuePrompt({
  lessonTitle,
  lessonSlug,
  courseTitle,
  courseSlug,
  className,
}: ContinuePromptProps) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden border-primary/20 transition-all duration-300 hover:shadow-xl hover:border-primary/40",
        className
      )}
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-blue-500/5 opacity-80" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-shimmer" />

      <CardContent className="relative flex items-center justify-between gap-6 p-6">
        <div className="flex items-center gap-4 min-w-0">
          {/* Play icon circle */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
            <Play className="h-6 w-6 ml-0.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-primary/70">
              Continue where you left off
            </p>
            <p className="mt-1 truncate text-lg font-bold">{lessonTitle}</p>
            <p className="text-sm text-muted-foreground">{courseTitle}</p>
          </div>
        </div>
        <Button asChild size="lg" className="shrink-0 gap-2 shadow-md transition-all group-hover:shadow-lg">
          <Link href={`/courses/${courseSlug}/lessons/${lessonSlug}`}>
            Resume
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
