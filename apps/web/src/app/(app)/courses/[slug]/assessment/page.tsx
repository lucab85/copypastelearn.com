export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getCourseAssessment } from "@/server/queries/course-extras";
import { MemberGate } from "@/components/course/member-gate";
import { AssessmentClient } from "./assessment-client";

interface Props {
  params: Promise<{ slug: string }>;
}

export const metadata: Metadata = {
  title: "Final Assessment",
  robots: { index: false, follow: false },
};

export default async function AssessmentPage({ params }: Props) {
  const { slug } = await params;
  const view = await getCourseAssessment(slug);
  if (!view) notFound();

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <Link
        href={`/courses/${slug}`}
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        {view.courseTitle}
      </Link>
      <h1 className="text-3xl font-bold tracking-tight">{view.title}</h1>
      <p className="mt-3 text-muted-foreground">
        {view.questionCount} questions, one correct answer each. Pass mark:{" "}
        {view.passPercent}%. Every answer comes with an explanation and the
        lesson to watch again.
      </p>
      {view.bestAttempt && (
        <p className="mt-2 text-sm">
          Your best result: {view.bestAttempt.score}/{view.bestAttempt.total}
          {view.bestAttempt.passed ? " (passed)" : ""}
        </p>
      )}
      <div className="mt-8">
        {view.access === "ok" ? (
          <AssessmentClient courseSlug={slug} questions={view.questions} />
        ) : (
          <MemberGate
            access={view.access}
            what="The final assessment"
            returnTo={`/courses/${slug}/assessment`}
          />
        )}
      </div>
    </div>
  );
}
