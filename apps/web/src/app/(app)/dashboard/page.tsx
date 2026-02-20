import { getDashboard } from "@/server/queries/dashboard";
import { ProgressCard } from "@/components/dashboard/progress-card";
import { ContinuePrompt } from "@/components/dashboard/continue-prompt";
import { ActiveLabCard } from "@/components/dashboard/active-lab-card";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  Sparkles,
  GraduationCap,
  Flame,
  Terminal,
  Trophy,
} from "lucide-react";

export const metadata = {
  title: "Dashboard",
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const data = await getDashboard();

  const mostRecent = data.recentLessons[0];
  const hasActivity =
    data.inProgressCourses.length > 0 ||
    data.completedCourses.length > 0 ||
    data.recentLessons.length > 0;

  const firstName = data.userName?.split(" ")[0];
  const totalCourses =
    data.inProgressCourses.length + data.completedCourses.length;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* ── Greeting Banner ──────────────────────────────── */}
      <section className="animate-fade-up relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border p-8">
        <div className="absolute right-0 top-0 -mr-8 -mt-8 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute left-1/2 bottom-0 -mb-16 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />
        <div className="relative">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {getGreeting()}
            {firstName ? `, ${firstName}` : ""} 👋
          </h1>
          <p className="mt-2 text-muted-foreground max-w-lg">
            {!hasActivity
              ? "Ready to start your learning journey? Browse our courses to begin."
              : data.completedCourses.length > 0 && data.inProgressCourses.length === 0
                ? `You've completed ${data.completedCourses.length} course${data.completedCourses.length > 1 ? "s" : ""}! Explore more to keep leveling up.`
                : "Here's your learning progress at a glance. Keep up the great work!"}
          </p>
        </div>
      </section>

      {/* ── Stats Overview ───────────────────────────────── */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="animate-fade-up stagger-1 group relative overflow-hidden rounded-xl border bg-card p-5 transition-all hover:shadow-lg hover:-translate-y-0.5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 transition-transform group-hover:scale-110">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{data.inProgressCourses.length}</p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
          </div>
        </div>

        <div className="animate-fade-up stagger-2 group relative overflow-hidden rounded-xl border bg-card p-5 transition-all hover:shadow-lg hover:-translate-y-0.5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 transition-transform group-hover:scale-110">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{data.completedCourses.length}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </div>
        </div>

        <div className="animate-fade-up stagger-3 group relative overflow-hidden rounded-xl border bg-card p-5 transition-all hover:shadow-lg hover:-translate-y-0.5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 transition-transform group-hover:scale-110">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{data.totalLessonsCompleted}</p>
              <p className="text-xs text-muted-foreground">Lessons Done</p>
            </div>
          </div>
        </div>

        <div className="animate-fade-up stagger-4 group relative overflow-hidden rounded-xl border bg-card p-5 transition-all hover:shadow-lg hover:-translate-y-0.5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 transition-transform group-hover:scale-110">
              <Flame className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{totalCourses}</p>
              <p className="text-xs text-muted-foreground">Total Courses</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Continue Where You Left Off ──────────────────── */}
      {mostRecent && !mostRecent.completed && (
        <div className="animate-fade-up stagger-5">
          <ContinuePrompt
            lessonTitle={mostRecent.title}
            lessonSlug={mostRecent.slug}
            courseTitle={mostRecent.courseTitle}
            courseSlug={mostRecent.courseSlug}
          />
        </div>
      )}

      {/* ── Active Lab Session ───────────────────────────── */}
      {data.activeLabSession && (
        <div className="animate-fade-up stagger-6">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <Terminal className="h-5 w-5 text-blue-500" />
            Active Lab
          </h2>
          <ActiveLabCard
            sessionId={data.activeLabSession.sessionId}
            labTitle={data.activeLabSession.labTitle}
            status={data.activeLabSession.status}
            expiresAt={data.activeLabSession.expiresAt}
          />
        </div>
      )}

      {/* ── Main Content: Courses + Recent Activity ──────── */}
      {hasActivity && (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* In-progress courses (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {data.inProgressCourses.length > 0 && (
              <section className="animate-fade-up stagger-6">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                  In Progress
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {data.inProgressCourses.map((course, i) => (
                    <ProgressCard
                      key={course.courseId}
                      title={course.title}
                      slug={course.slug}
                      percentComplete={course.percentComplete}
                      nextLesson={course.nextLesson}
                      thumbnailUrl={course.thumbnailUrl}
                      className={`animate-scale-in stagger-${Math.min(i + 1, 8)}`}
                    />
                  ))}
                </div>
              </section>
            )}

            {data.completedCourses.length > 0 && (
              <section className="animate-fade-up stagger-7">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Completed
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {data.completedCourses.map((course, i) => (
                    <ProgressCard
                      key={course.courseId}
                      title={course.title}
                      slug={course.slug}
                      percentComplete={course.percentComplete}
                      className={`animate-scale-in stagger-${Math.min(i + 1, 8)}`}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Recent Activity sidebar (1/3 width) */}
          <aside className="animate-fade-up stagger-7">
            <RecentActivity lessons={data.recentLessons} />
          </aside>
        </div>
      )}

      {/* ── Empty State ──────────────────────────────────── */}
      {!hasActivity && (
        <div className="animate-fade-up stagger-5 flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center">
          <div className="animate-float mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5">
            <Sparkles className="h-10 w-10 text-primary/60" />
          </div>
          <h2 className="text-2xl font-bold">Welcome to CopyPasteLearn!</h2>
          <p className="mt-3 max-w-md text-muted-foreground">
            Start your hands-on learning journey with real terminal labs and practical courses.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/courses">
              <Sparkles className="mr-2 h-4 w-4" />
              Browse Courses
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
