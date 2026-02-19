import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
      <Card className="h-full transition-shadow hover:shadow-md">
        {course.thumbnailUrl && (
          <div className="aspect-video w-full overflow-hidden rounded-t-lg">
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge variant={difficultyColors[course.difficulty] ?? "default"}>
              {course.difficulty.toLowerCase()}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {course.lessonCount} {course.lessonCount === 1 ? "lesson" : "lessons"}
            </span>
          </div>
          <CardTitle className="text-lg">{course.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="line-clamp-2 text-sm text-muted-foreground">
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
