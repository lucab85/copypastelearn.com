import { cn } from "@/lib/utils";

/** "New": on the cards of a course published in the last 30 days. */
export function NewBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full bg-emerald-700 px-2 py-0.5 text-xs font-semibold leading-none text-white",
        className
      )}
    >
      New
    </span>
  );
}
