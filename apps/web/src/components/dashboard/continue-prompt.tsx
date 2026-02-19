"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Play } from "lucide-react";

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
        "border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10",
        className
      )}
    >
      <CardContent className="flex items-center justify-between gap-4 p-6">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">Continue where you left off</p>
          <p className="mt-1 truncate text-lg font-semibold">{lessonTitle}</p>
          <p className="text-sm text-muted-foreground">{courseTitle}</p>
        </div>
        <Button asChild className="shrink-0">
          <Link href={`/courses/${courseSlug}/lessons/${lessonSlug}`}>
            <Play className="mr-2 h-4 w-4" />
            Resume
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
