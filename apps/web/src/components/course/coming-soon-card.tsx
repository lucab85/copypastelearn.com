import type { UpcomingCourse } from "@copypastelearn/shared";
import { Badge } from "@/components/ui/badge";
import { difficultyLabel } from "@/lib/home-catalog";
import { cn } from "@/lib/utils";

/**
 * An announced DRAFT course: title and description only, never a link (it has
 * no course page until it is published).
 */
export function ComingSoonCard({
  course,
  standalone = false,
  className,
}: {
  course: UpcomingCourse;
  /**
   * For a card that sits among course cards, with no "Coming soon" heading
   * above it: the card says it itself, on a line above the title.
   */
  standalone?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-dashed bg-muted/20 p-4", className)}>
      {standalone ? (
        <>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Coming soon
          </p>
          <p className="mt-2 line-clamp-3 text-[15px] font-semibold leading-snug">
            {course.title}
          </p>
        </>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold leading-snug">{course.title}</p>
          <Badge variant="outline" className="shrink-0 text-xs">
            {course.difficulty.toLowerCase()}
          </Badge>
        </div>
      )}
      <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
        {course.description}
      </p>
      {standalone && (
        <p className="mt-3 text-xs text-muted-foreground">
          {difficultyLabel(course.difficulty)}
        </p>
      )}
    </div>
  );
}
