"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackPaywallView } from "@/lib/analytics";
import { forgetLesson, recallLesson, rememberLesson, type ResumeLesson } from "@/lib/resume-lesson";

/** Keeps the lesson to come back to after sign-up or payment. Renders nothing. */
export function RememberLesson({ path, title }: ResumeLesson) {
  useEffect(() => {
    rememberLesson({ path, title });
  }, [path, title]);
  return null;
}

/** Counts a view of a locked lesson (GA4 `paywall_view`). Renders nothing. */
export function PaywallView({ courseSlug, signedIn }: { courseSlug: string; signedIn: boolean }) {
  useEffect(() => {
    trackPaywallView(window.location.pathname, { course_slug: courseSlug, signed_in: signedIn });
  }, [courseSlug, signedIn]);
  return null;
}

/** A button back to the remembered lesson, or to the catalog without one. */
export function ResumeLessonButton() {
  const [lesson, setLesson] = useState<ResumeLesson | null>(null);
  useEffect(() => setLesson(recallLesson()), []);

  return (
    <Button asChild size="lg" className="max-w-full shrink-0 gap-2">
      {lesson ? (
        <Link href={lesson.path} onClick={forgetLesson}>
          <span className="truncate">Continue: {lesson.title}</span>
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </Link>
      ) : (
        <Link href="/courses">Browse the courses</Link>
      )}
    </Button>
  );
}
