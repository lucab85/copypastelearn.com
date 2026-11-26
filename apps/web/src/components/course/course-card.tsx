import Link from "next/link";
import type { CourseListItem } from "@copypastelearn/shared";
import { CourseThumb } from "@/components/course/course-thumb";
import { NewBadge } from "@/components/course/new-badge";
import { courseMeta, formatMonth } from "@/lib/home-catalog";
import { cn } from "@/lib/utils";

interface CourseCardProps {
  course: CourseListItem;
  /** No description and no footer: for rows of four cards. */
  compact?: boolean;
  /** `sizes` of the cover, when the card is not in the usual 1/2/3 grid. */
  sizes?: string;
  /** Published in the last 30 days: the card says "New" before the title. */
  isNew?: boolean;
  className?: string;
}

/** Shared by every card-shaped link: border, radius, lift, focus ring. */
export const cardLinkClass =
  "group flex h-full flex-col rounded-2xl border bg-card text-card-foreground outline-none transition-[border-color,box-shadow,transform] duration-200 hover:border-foreground/30 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-safe:hover:-translate-y-0.5";

export function CourseCard({
  course,
  compact = false,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  isNew = false,
  className,
}: CourseCardProps) {
  const progress = course.userProgress
    ? Math.round(course.userProgress.percentComplete)
    : null;

  return (
    <Link
      href={`/courses/${course.slug}`}
      className={cn(cardLinkClass, compact ? "p-2.5" : "p-3", className)}
    >
      <CourseThumb src={course.thumbnailUrl} sizes={sizes} />
      <div className={cn("flex flex-1 flex-col", compact ? "px-1.5 pb-1.5 pt-3" : "px-2 pb-2 pt-4")}>
        <h3
          className={cn(
            "line-clamp-3 font-semibold leading-snug tracking-tight",
            compact ? "text-[15px]" : "text-lg"
          )}
        >
          {isNew && <NewBadge className="mr-2 align-[3px]" />}
          {course.title}
        </h3>
        {!compact && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {course.description}
          </p>
        )}
        <p
          className={cn(
            "mt-auto text-muted-foreground",
            compact ? "pt-2 text-xs" : "pt-4 text-sm"
          )}
        >
          {courseMeta(course)}
          {!compact && course.updatedAt && (
            <span className="whitespace-nowrap">
              {" · "}Updated {formatMonth(course.updatedAt)}
            </span>
          )}
        </p>
        {progress !== null ? (
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-secondary"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Course progress: ${progress}%`}
            >
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${course.userProgress?.percentComplete ?? 0}%` }}
              />
            </div>
          </div>
        ) : (
          !compact && (
            <p className="mt-3 text-sm font-medium text-foreground underline-offset-4 group-hover:underline">
              Preview free lesson <span aria-hidden="true">→</span>
            </p>
          )
        )}
      </div>
    </Link>
  );
}
