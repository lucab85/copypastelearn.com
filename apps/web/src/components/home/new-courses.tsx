import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CourseListItem } from "@copypastelearn/shared";
import { CourseRow } from "@/components/course/course-row";

/** Every course published in the last 30 days, so a new one is not missed. */
export function NewCourses({ courses }: { courses: CourseListItem[] }) {
  if (courses.length === 0) return null;
  return (
    <section aria-labelledby="home-new" className="pt-10 lg:pt-14">
      <div className="container mx-auto px-4">
        <div className="rounded-2xl border p-3 sm:p-5">
          <div className="flex flex-wrap items-end justify-between gap-3 pl-2">
            <div>
              <h2
                id="home-new"
                className="text-2xl font-bold tracking-tight sm:text-3xl"
              >
                New courses
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {courses.length === 1
                  ? "1 course added in the last 30 days."
                  : `${courses.length} courses added in the last 30 days.`}{" "}
                The first lesson of each is free.
              </p>
            </div>
            <Link
              href="/courses"
              className="inline-flex h-9 items-center gap-1 rounded-full px-3 text-sm font-medium text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              All courses
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <ul className="mt-3 grid gap-1 sm:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <li key={course.id} className="min-w-0">
                <CourseRow course={course} heading="h3" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
