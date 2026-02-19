import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen, Clock } from "lucide-react";
import type { CourseListItem } from "@copypastelearn/shared";

const difficultyColors: Record<string, "default" | "secondary" | "destructive"> = {
  BEGINNER: "secondary",
  INTERMEDIATE: "default",
  ADVANCED: "destructive",
};

interface CourseCardProps {
  course: CourseListItem;
}

export function CourseCard({ course }: CourseCardProps) {
  return (
    <Link href={`/courses/${course.slug}`}>
      <Card className="group h-full transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
        {course.thumbnailUrl ? (
          <div className="aspect-video w-full overflow-hidden rounded-t-lg">
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="flex aspect-video w-full items-center justify-center rounded-t-lg bg-gradient-to-br from-primary/10 to-primary/5">
            <BookOpen className="h-10 w-10 text-primary/40" />
          </div>
        )}
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Badge variant={difficultyColors[course.difficulty] ?? "default"} className="text-xs">
              {course.difficulty.toLowerCase()}
            </Badge>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {course.lessonCount} {course.lessonCount === 1 ? "lesson" : "lessons"}
            </span>
          </div>
          <CardTitle className="text-lg leading-snug group-hover:text-primary transition-colors">
            {course.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {course.description}
          </p>
        </CardContent>
        {course.userProgress && (
          <CardFooter>
            <div className="w-full">
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{Math.round(course.userProgress.percentComplete)}%</span>
              </div>
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-secondary"
                role="progressbar"
                aria-valuenow={Math.round(course.userProgress.percentComplete)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Course progress: ${Math.round(course.userProgress.percentComplete)}%`}
              >
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${course.userProgress.percentComplete}%`,
                  }}
                />
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
    </Link>
  );
}
