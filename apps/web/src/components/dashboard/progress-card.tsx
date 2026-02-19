"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BookOpen, ChevronRight } from "lucide-react";

interface ProgressCardProps {
  title: string;
  slug: string;
  percentComplete: number;
  nextLesson?: { slug: string; title: string } | null;
  thumbnailUrl?: string | null;
  className?: string;
}

export function ProgressCard({
  title,
  slug,
  percentComplete,
  nextLesson,
  className,
}: ProgressCardProps) {
  const isComplete = percentComplete >= 100;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          <Link
            href={`/courses/${slug}`}
            className="hover:underline"
          >
            {title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Progress bar */}
        <div>
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>{isComplete ? "Completed" : "In progress"}</span>
            <span>{Math.round(percentComplete)}%</span>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-secondary"
            role="progressbar"
            aria-valuenow={Math.round(percentComplete)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${title} progress: ${Math.round(percentComplete)}%`}
          >
            <div
              className={cn(
                "h-full rounded-full transition-all",
                isComplete ? "bg-green-500" : "bg-primary"
              )}
              style={{ width: `${Math.min(percentComplete, 100)}%` }}
            />
          </div>
        </div>

        {/* Next lesson suggestion */}
        {nextLesson && !isComplete && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between"
            asChild
          >
            <Link href={`/courses/${slug}/lessons/${nextLesson.slug}`}>
              <span className="flex items-center gap-2 truncate">
                <BookOpen className="h-3 w-3 shrink-0" />
                <span className="truncate">{nextLesson.title}</span>
              </span>
              <ChevronRight className="h-3 w-3 shrink-0" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
