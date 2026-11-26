import Link from "next/link";
import type { CourseListItem } from "@copypastelearn/shared";
import { CourseThumb } from "@/components/course/course-thumb";
import { NewBadge } from "@/components/course/new-badge";
import { courseMeta } from "@/lib/home-catalog";

/** A small horizontal course card: cover on the left, title and one quiet line. */
export function CourseRow({
  course,
  isNew = false,
}: {
  course: CourseListItem;
  /** Published in the last 30 days: the row says "New" before the title. */
  isNew?: boolean;
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
        <h4 className="line-clamp-2 text-[15px] font-semibold leading-snug tracking-tight underline-offset-4 group-hover:underline">
          {isNew && <NewBadge className="mr-1.5 align-[2px]" />}
          {course.title}
        </h4>
        <p className="mt-1 text-xs leading-snug text-muted-foreground">
          {courseMeta(course)}
        </p>
      </div>
    </Link>
  );
}
