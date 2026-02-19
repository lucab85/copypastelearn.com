"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Terminal } from "lucide-react";

interface LessonItem {
  id: string;
  title: string;
  sortOrder: number;
  status: string;
  hasLab: boolean;
}

interface LessonListProps {
  courseId: string;
  lessons: LessonItem[];
}

export function LessonList({ courseId, lessons }: LessonListProps) {
  if (lessons.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">No lessons yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {lessons.map((lesson, index) => (
        <Link
          key={lesson.id}
          href={`/admin/courses/${courseId}/lessons/${lesson.id}`}
          className="flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-accent/50"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
            {index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <span className="font-medium">{lesson.title}</span>
          </div>
          <div className="flex items-center gap-2">
            {lesson.hasLab && (
              <Terminal className="h-4 w-4 text-muted-foreground" />
            )}
            <Badge
              variant={
                lesson.status === "PUBLISHED" ? "default" : "secondary"
              }
              className="text-xs"
            >
              {lesson.status.toLowerCase()}
            </Badge>
          </div>
        </Link>
      ))}
    </div>
  );
}
