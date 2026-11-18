import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CourseRow } from "@/components/course/course-row";
import type { HomeColumn } from "@/lib/home-catalog";
import { cn } from "@/lib/utils";

/** Up to three titled lists of three small course cards, each with "see all". */
export function CourseColumns({ columns }: { columns: HomeColumn[] }) {
  if (columns.length === 0) return null;
  return (
    <section aria-labelledby="home-columns" className="py-10 lg:py-14">
      <div className="container mx-auto px-4">
        <h2
          id="home-columns"
          className="text-2xl font-bold tracking-tight sm:text-3xl"
        >
          Find your next course
        </h2>
        <div
          className={cn(
            "mt-6 grid gap-5 lg:grid-cols-2",
            columns.length >= 3 && "xl:grid-cols-3"
          )}
        >
          {columns.map((column, index) => (
            <div
              key={column.id}
              className={cn(
                "min-w-0 rounded-2xl border p-3 sm:p-4",
                // Two columns between lg and xl: the third list takes the
                // full row, its three courses side by side.
                index === 2 && "lg:max-xl:col-span-2"
              )}
            >
              <div className="flex items-center justify-between gap-3 pl-2">
                <h3 className="text-lg font-semibold tracking-tight">
                  {column.title}
                </h3>
                <Link
                  href={column.href}
                  aria-label={column.hrefLabel}
                  title={column.hrefLabel}
                  className="inline-flex h-9 items-center gap-1 rounded-full px-3 text-sm font-medium text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  See all
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
              <ul
                className={cn(
                  "mt-2 grid gap-1",
                  index === 2 && "lg:max-xl:grid-cols-3 lg:max-xl:gap-x-2"
                )}
              >
                {column.courses.map((course) => (
                  <li key={course.id} className="min-w-0">
                    <CourseRow course={course} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
