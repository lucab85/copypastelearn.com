import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cardLinkClass } from "@/components/course/course-card";
import { cn } from "@/lib/utils";

export interface Goal {
  href: string;
  /** What the visitor wants, in their words. */
  title: string;
  /** Where the card goes: the track or page name. */
  target: string;
  /** "5 courses, 1 coming soon" */
  meta?: string;
}

/**
 * "What do you want to do first?": each answer is a plain link to the track
 * or page that matches it. Nothing is stored and nothing is personalized.
 */
export function GoalChooser({ goals }: { goals: Goal[] }) {
  if (goals.length === 0) return null;
  return (
    <section aria-labelledby="home-goals" className="border-t py-12 lg:py-16">
      <div className="container mx-auto px-4">
        <h2
          id="home-goals"
          className="text-2xl font-bold tracking-tight sm:text-3xl"
        >
          What do you want to do first?
        </h2>
        <ul
          className={cn(
            "mt-6 grid gap-4 sm:grid-cols-2",
            goals.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"
          )}
        >
          {goals.map((goal) => (
            <li key={goal.href + goal.title}>
              <Link href={goal.href} className={cn(cardLinkClass, "p-5")}>
                <span className="text-lg font-semibold leading-snug tracking-tight">
                  {goal.title}
                </span>
                <span className="mt-auto flex items-end justify-between gap-3 pt-6 text-sm text-muted-foreground">
                  <span>
                    <span className="block font-medium text-foreground">
                      {goal.target}
                    </span>
                    {goal.meta && <span className="block">{goal.meta}</span>}
                  </span>
                  <ArrowRight
                    className="h-4 w-4 shrink-0 text-foreground transition-transform motion-safe:group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
