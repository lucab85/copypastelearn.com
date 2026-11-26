import Link from "next/link";
import type { CourseListItem } from "@copypastelearn/shared";
import { CourseThumb } from "@/components/course/course-thumb";
import { courseMeta } from "@/lib/home-catalog";

/** A small horizontal course card: cover on the left, title and one quiet line. */
export function CourseRow({
  course,
  heading: Heading = "h4",
}: {
  course: CourseListItem;
  /** Level of the title: one below the heading the row is listed under. */
  heading?: "h3" | "h4";
}) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex items-center gap-3.5 rounded-xl p-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <CourseThumb
        src={course.thumbnailUrl}
        sizes="112px"
        className="w-28 shrink-0 border transition-colors group-hover:border-foreground/40"
      />
      <div className="min-w-0">
        <Heading className="line-clamp-2 text-[15px] font-semibold leading-snug tracking-tight underline-offset-4 group-hover:underline">
          {course.title}
        </Heading>
        <p className="mt-1 text-xs leading-snug text-muted-foreground">
          {courseMeta(course)}
        </p>
      </div>
    </Link>
  );
}
