import { getDashboard } from "@/server/queries/dashboard";
import { ProgressCard } from "@/components/dashboard/progress-card";
import { ContinuePrompt } from "@/components/dashboard/continue-prompt";
import { ActiveLabCard } from "@/components/dashboard/active-lab-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BookOpen, CheckCircle2, Sparkles } from "lucide-react";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const data = await getDashboard();

  const mostRecent = data.recentLessons[0];
  const hasActivity =
    data.inProgressCourses.length > 0 ||
    data.completedCourses.length > 0 ||
    data.recentLessons.length > 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Dashboard</h1>

      {/* Continue where you left off */}
      {mostRecent && !mostRecent.completed && (
        <ContinuePrompt
          lessonTitle={mostRecent.title}
          lessonSlug={mostRecent.slug}
          courseTitle={mostRecent.courseTitle}
          courseSlug={mostRecent.courseSlug}
          className="mb-8"
        />
      )}

      {/* Active lab session */}
      {data.activeLabSession && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">Active Lab</h2>
          <ActiveLabCard
            sessionId={data.activeLabSession.sessionId}
            labTitle={data.activeLabSession.labTitle}
            status={data.activeLabSession.status}
            expiresAt={data.activeLabSession.expiresAt}
          />
        </section>
      )}

      {/* In-progress courses */}
      {data.inProgressCourses.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <BookOpen className="h-5 w-5" />
            In Progress
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.inProgressCourses.map((course) => (
              <ProgressCard
                key={course.courseId}
                title={course.title}
                slug={course.slug}
                percentComplete={course.percentComplete}
                nextLesson={course.nextLesson}
                thumbnailUrl={course.thumbnailUrl}
              />
            ))}
          </div>
        </section>
      )}

      {/* Completed courses */}
      {data.completedCourses.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Completed
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.completedCourses.map((course) => (
              <ProgressCard
                key={course.courseId}
                title={course.title}
                slug={course.slug}
                percentComplete={course.percentComplete}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {!hasActivity && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Sparkles className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Welcome!</h2>
          <p className="mt-2 max-w-sm text-muted-foreground">
            Start your learning journey by exploring our courses.
          </p>
          <Button asChild className="mt-6">
            <Link href="/courses">Browse Courses</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
