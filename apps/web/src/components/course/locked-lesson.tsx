import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrackedLink } from "@/components/analytics/tracked-link";
import { ProPitchLines } from "@/components/course/pro-pitch";
import { PaywallView, RememberLesson } from "@/components/course/resume-lesson";
import type { ProPitch } from "@/lib/pro-pitch";
import { authUrl, lessonPath } from "@/lib/resume-lesson";

interface LockedLessonProps {
  courseSlug: string;
  lessonSlug: string;
  /** The lesson's title, when its public facts are shown above this card. */
  lessonTitle: string | null;
  signedIn: boolean;
  /** Null when the plan could not be read: the card then names no price. */
  pitch: ProPitch | null;
}

/**
 * What a visitor without Pro sees in place of a paid lesson: what unlocks it,
 * what it costs, and one button to the plans.
 */
export function LockedLesson({ courseSlug, lessonSlug, lessonTitle, signedIn, pitch }: LockedLessonProps) {
  const path = lessonPath(courseSlug, lessonSlug);
  const Heading = lessonTitle ? "h2" : "h1";

  return (
    <>
      <PaywallView courseSlug={courseSlug} signedIn={signedIn} />
      {lessonTitle && <RememberLesson path={path} title={lessonTitle} />}
      <section className="w-full max-w-md rounded-xl border bg-card p-6">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Lock className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>
        <Heading className="text-xl font-semibold">This lesson is part of Pro</Heading>
        <p className="mt-2 text-sm text-muted-foreground">
          The first lesson of every course is free. Pro unlocks the rest of this course and every other
          course, including the ones added later.
        </p>
        {pitch && <ProPitchLines pitch={pitch} className="mt-4" />}
        <Button asChild className="mt-5 w-full">
          <TrackedLink href="/pricing" ctaText="See plans" ctaLocation="locked_lesson">
            See plans
          </TrackedLink>
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          Cancel anytime. The first payment can be refunded within 14 days, under the conditions of the{" "}
          <Link href="/refund-policy" className="underline underline-offset-2">
            refund policy
          </Link>
          .
        </p>
      </section>
      <p className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
        <Link href={`/courses/${courseSlug}`} className="underline underline-offset-4 hover:text-foreground">
          Back to the course
        </Link>
        {!signedIn && (
          <Link href={authUrl("/sign-in", path)} className="underline underline-offset-4 hover:text-foreground">
            Already subscribed? Sign in
          </Link>
        )}
      </p>
    </>
  );
}
