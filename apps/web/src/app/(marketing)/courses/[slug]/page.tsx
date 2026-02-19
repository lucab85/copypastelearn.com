import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCourse } from "@/server/queries/courses";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Clock, BookOpen, Lock, CheckCircle2, Play } from "lucide-react";

export const revalidate = 3600;

interface CourseDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CourseDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) return {};
  return {
    title: course.title,
    description: course.description,
    alternates: { canonical: `/courses/${slug}` },
    openGraph: {
      title: course.title,
      description: course.description ?? undefined,
      type: "article",
      ...(course.thumbnailUrl && { images: [{ url: course.thumbnailUrl }] }),
    },
  };
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { slug } = await params;
  const course = await getCourse(slug);

  if (!course) {
    notFound();
  }

  const totalDuration = course.lessons.reduce(
    (acc, l) => acc + (l.durationSeconds ?? 0),
    0
  );
  const hours = Math.floor(totalDuration / 3600);
  const minutes = Math.floor((totalDuration % 3600) / 60);

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero */}
      <div className="mb-8">
        <Badge variant="secondary" className="mb-3">
          {course.difficulty.toLowerCase()}
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight">{course.title}</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
          {course.description}
        </p>

        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            {course.lessons.length}{" "}
            {course.lessons.length === 1 ? "lesson" : "lessons"}
          </span>
          {totalDuration > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {hours > 0 && `${hours}h `}
              {minutes}m
            </span>
          )}
        </div>

        {course.userProgress && (
          <div className="mt-4 max-w-md">
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>Your progress</span>
              <span>{Math.round(course.userProgress.percentComplete)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${course.userProgress.percentComplete}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-12 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Outcomes */}
          {course.outcomes.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold">What you&apos;ll learn</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {course.outcomes.map((outcome, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-sm">{outcome}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Prerequisites */}
          {course.prerequisites.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold">Prerequisites</h2>
              <ul className="space-y-1">
                {course.prerequisites.map((prereq, i) => (
                  <li key={i} className="text-sm text-muted-foreground">
                    • {prereq}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <Separator className="my-8" />

          {/* Lesson List */}
          <section>
            <h2 className="mb-4 text-xl font-semibold">Lessons</h2>
            <div className="space-y-2">
              {course.lessons.map((lesson, index) => (
                <div
                  key={lesson.id}
                  className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-accent/50"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {lesson.isAccessible ? (
                        <Link
                          href={`/courses/${slug}/lessons/${lesson.slug}`}
                          className="font-medium hover:underline truncate"
                        >
                          {lesson.title}
                        </Link>
                      ) : (
                        <span className="font-medium text-muted-foreground truncate">
                          {lesson.title}
                        </span>
                      )}
                      {lesson.isFree && (
                        <Badge variant="secondary" className="text-xs">
                          Free
                        </Badge>
                      )}
                      {lesson.hasLab && (
                        <Badge variant="outline" className="text-xs">
                          Lab
                        </Badge>
                      )}
                    </div>
                    {lesson.durationSeconds && (
                      <p className="text-xs text-muted-foreground">
                        {Math.ceil(lesson.durationSeconds / 60)} min
                      </p>
                    )}
                  </div>
                  <div className="shrink-0">
                    {lesson.userProgress?.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : !lesson.isAccessible ? (
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Play className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 rounded-lg border p-6">
            <h3 className="mb-4 text-lg font-semibold">Get started</h3>
            {course.lessons.length > 0 && (
              <Button asChild className="w-full">
                <Link
                  href={`/courses/${slug}/lessons/${course.lessons[0].slug}`}
                >
                  {course.userProgress
                    ? "Continue Learning"
                    : "Start First Lesson"}
                </Link>
              </Button>
            )}
            <p className="mt-3 text-center text-xs text-muted-foreground">
              First lesson is always free
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
