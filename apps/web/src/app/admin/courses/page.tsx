import { db } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

export const metadata = { title: "Courses" };

export default async function AdminCoursesPage() {
  const courses = await db.course.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { lessons: true } },
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Courses</h1>
        <Button asChild>
          <Link href="/admin/courses/new">
            <Plus className="mr-2 h-4 w-4" />
            New Course
          </Link>
        </Button>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No courses yet.</p>
          <Button asChild className="mt-4">
            <Link href="/admin/courses/new">Create your first course</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/admin/courses/${course.id}`}
              className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent/50"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{course.title}</span>
                  <Badge
                    variant={
                      course.status === "PUBLISHED" ? "default" : "secondary"
                    }
                  >
                    {course.status.toLowerCase()}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {course._count.lessons} lesson
                  {course._count.lessons !== 1 ? "s" : ""} · {course.difficulty.toLowerCase()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
