import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CourseForm } from "@/components/admin/course-form";
import { LessonList } from "@/components/admin/lesson-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Plus } from "lucide-react";
import { publishCourse, unpublishCourse } from "@/server/actions/admin";

interface CourseEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function CourseEditPage({ params }: CourseEditPageProps) {
  const { id } = await params;

  const course = await db.course.findUnique({
    where: { id },
    include: {
      lessons: {
        orderBy: { sortOrder: "asc" },
        include: {
          labDefinition: { select: { id: true } },
        },
      },
    },
  });

  if (!course) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{course.title}</h1>
          <Badge
            variant={course.status === "PUBLISHED" ? "default" : "secondary"}
          >
            {course.status.toLowerCase()}
          </Badge>
        </div>
        <form>
          {course.status === "DRAFT" ? (
            <Button
              formAction={async () => {
                "use server";
                await publishCourse(id);
              }}
              variant="default"
            >
              Publish
            </Button>
          ) : (
            <Button
              formAction={async () => {
                "use server";
                await unpublishCourse(id);
              }}
              variant="outline"
            >
              Unpublish
            </Button>
          )}
        </form>
      </div>

      {/* Course Form */}
      <CourseForm
        course={{
          id: course.id,
          title: course.title,
          description: course.description,
          difficulty: course.difficulty,
          outcomes: course.outcomes,
          prerequisites: course.prerequisites,
          estimatedDuration: course.estimatedDuration?.toString() ?? null,
          sortOrder: course.sortOrder,
        }}
      />

      <Separator />

      {/* Lessons */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Lessons</h2>
          <Button asChild size="sm">
            <Link href={`/admin/courses/${id}/lessons/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Add Lesson
            </Link>
          </Button>
        </div>
        <LessonList
          courseId={id}
          lessons={course.lessons.map((l) => ({
            id: l.id,
            title: l.title,
            sortOrder: l.sortOrder,
            status: l.status,
            hasLab: !!l.labDefinition,
          }))}
        />
      </div>
    </div>
  );
}
