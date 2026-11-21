import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { ResumeLessonButton } from "@/components/course/resume-lesson";

/** Shown once, on the page Clerk returns to after a paid checkout. */
export function CheckoutSuccessBanner() {
  return (
    <section
      role="status"
      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-6"
    >
      <div className="flex min-w-0 items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
        <div>
          <h2 className="text-xl font-semibold">Your Pro subscription is active</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Every lesson of every course is unlocked, including the ones added later. You can manage or
            cancel the plan in{" "}
            <Link href="/settings" className="underline underline-offset-2">
              Settings
            </Link>
            .
          </p>
        </div>
      </div>
      <ResumeLessonButton />
    </section>
  );
}
