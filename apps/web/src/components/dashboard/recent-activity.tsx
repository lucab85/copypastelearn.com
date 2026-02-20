"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { BookOpen, CheckCircle2, Clock } from "lucide-react";
import type { RecentLesson } from "@copypastelearn/shared";

interface RecentActivityProps {
  lessons: RecentLesson[];
  className?: string;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function RecentActivity({ lessons, className }: RecentActivityProps) {
  if (lessons.length === 0) return null;

  return (
    <div className={cn("rounded-xl border bg-card p-5", className)}>
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        <Clock className="h-4 w-4" />
        Recent Activity
      </h3>

      <div className="relative space-y-0">
        {/* Timeline line */}
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />

        {lessons.map((lesson, i) => (
          <div
            key={lesson.lessonId}
            className={cn(
              "animate-slide-in-right group relative flex gap-3 py-3",
              `stagger-${Math.min(i + 1, 8)}`
            )}
          >
            {/* Timeline dot */}
            <div
              className={cn(
                "relative z-10 mt-0.5 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border-2 border-background transition-colors",
                lesson.completed
                  ? "bg-green-500/10 text-green-500"
                  : "bg-primary/10 text-primary"
              )}
            >
              {lesson.completed ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <BookOpen className="h-3.5 w-3.5" />
              )}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1 pt-0.5">
              <Link
                href={`/courses/${lesson.courseSlug}/lessons/${lesson.slug}`}
                className="block text-sm font-medium leading-tight hover:underline line-clamp-1 transition-colors hover:text-primary"
              >
                {lesson.title}
              </Link>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="truncate">{lesson.courseTitle}</span>
                <span className="shrink-0">·</span>
                <span className="shrink-0">{timeAgo(lesson.lastAccessedAt)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
