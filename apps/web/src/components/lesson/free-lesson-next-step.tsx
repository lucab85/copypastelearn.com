import { Button } from "@/components/ui/button";
import { TrackedLink } from "@/components/analytics/tracked-link";
import { ProPitchLines } from "@/components/course/pro-pitch";
import { RememberLesson } from "@/components/course/resume-lesson";
import type { ProPitch } from "@/lib/pro-pitch";
import { authUrl, lessonPath } from "@/lib/resume-lesson";

interface FreeLessonNextStepProps {
  courseSlug: string;
  lessonSlug: string;
  nextLesson: { slug: string; title: string } | null;
  signedIn: boolean;
  /** Null when the plan could not be read: the panel then names no price. */
  pitch: ProPitch | null;
}

/**
 * Under the free lesson, for a viewer without Pro: what comes next and what it
 * costs. The player brings it into view when the video ends.
 */
export function FreeLessonNextStep({ courseSlug, lessonSlug, nextLesson, signedIn, pitch }: FreeLessonNextStepProps) {
  return (
    <section aria-labelledby="next-step" className="rounded-xl border bg-card p-6">
      {nextLesson && (
        <RememberLesson path={lessonPath(courseSlug, nextLesson.slug)} title={nextLesson.title} />
      )}
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">This is the free lesson</p>
      <h2 id="next-step" className="mt-1 text-xl font-semibold">
        {nextLesson ? `Next: ${nextLesson.title}` : "Every other course is in Pro"}
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        {nextLesson
          ? "The rest of this course is part of Pro, together with every other course and the ones added later."
          : "Pro unlocks every lesson of every course, including the ones added later."}
      </p>
      {pitch && <ProPitchLines pitch={pitch} className="mt-4 max-w-2xl" />}
      <div className="mt-5 flex flex-wrap gap-3">
        <Button asChild>
          <TrackedLink href="/pricing" ctaText="See plans" ctaLocation="free_lesson_next_step">
            See plans
          </TrackedLink>
        </Button>
        {!signedIn && (
          <Button asChild variant="outline">
            <TrackedLink
              href={authUrl("/sign-up", lessonPath(courseSlug, lessonSlug))}
              ctaText="Create a free account"
              ctaLocation="free_lesson_next_step"
            >
              Create a free account
            </TrackedLink>
          </Button>
        )}
      </div>
      {!signedIn && (
        <p className="mt-3 text-xs text-muted-foreground">
          A free account keeps your progress across devices. The paid lessons need Pro.
        </p>
      )}
    </section>
  );
}
