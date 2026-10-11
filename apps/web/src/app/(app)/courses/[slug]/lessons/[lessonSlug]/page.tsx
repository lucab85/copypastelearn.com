export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getLesson } from "@/server/queries/lessons";
import { getLessonPublicMeta } from "@/server/queries/lessons";
import { generateMuxTokens } from "@/lib/mux";
import { LessonPlayerClient } from "./lesson-player-client";
import { TranscriptPanel } from "@/components/lesson/transcript-panel";
import { CodeSnippet } from "@/components/lesson/code-snippet";
import { ResourceList } from "@/components/lesson/resource-list";
import { LabLauncher } from "./lab-launcher";
import { Button } from "@/components/ui/button";
import { CheckoutButton } from "@/components/checkout-button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageEventTracker } from "@/components/analytics/page-event-tracker";
import { brandedTitle, pickDescription } from "@/lib/seo";

// Per-request memoization so generateMetadata + the page body share one DB call.
const loadLesson = cache(getLesson);

interface LessonPageProps {
  params: Promise<{ slug: string; lessonSlug: string }>;
}

export async function generateMetadata({
  params,
}: LessonPageProps): Promise<Metadata> {
  const { slug, lessonSlug } = await params;
  // Resolve indexability from whether the lesson EXISTS, never from whether the
  // current (often unauthenticated) request can access it. Paywalled lessons
  // must stay indexable; only genuinely missing lessons get `noindex`.
  const meta = await getLessonPublicMeta(slug, lessonSlug);

  if (!meta) {
    return {
      title: `${lessonSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`,
      description:
        "This lesson is part of a CopyPasteLearn course. Subscribe to unlock expert video lessons and hands-on interactive labs in real environments.",
      alternates: { canonical: `/courses/${slug}/lessons/${lessonSlug}` },
      openGraph: { url: `/courses/${slug}/lessons/${lessonSlug}`, type: "website" },
      robots: { index: false, follow: false },
    };
  }

  const title = meta.title
    .replace(/ — CopyPasteLearn$/i, "")
    .replace(/ \| CopyPasteLearn$/i, "");
  return {
    // Long lesson titles drop the brand suffix rather than exceed 60 chars.
    title: brandedTitle(title),
    // Fall back to shorter copy when a long lesson title would push the
    // description past 155 chars.
    description: pickDescription([
      `Watch the ${title} lesson on CopyPasteLearn. Master IT automation with expert-led video instruction and hands-on interactive labs.`,
      `Watch the ${title} lesson on CopyPasteLearn, with expert-led video instruction and hands-on interactive labs.`,
      `${title}: a CopyPasteLearn video lesson with hands-on labs.`,
    ]),
    alternates: { canonical: `/courses/${slug}/lessons/${lessonSlug}` },
    openGraph: { url: `/courses/${slug}/lessons/${lessonSlug}`, type: "website" },
    robots: { index: true, follow: true },
  };
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { slug, lessonSlug } = await params;

  let lesson;
  try {
    lesson = await loadLesson(slug, lessonSlug);
  } catch (error: unknown) {
    if (error && typeof error === "object" && "statusCode" in error) {
      const err = error as { statusCode: number; message?: string };
      if (err.statusCode === 404) notFound();
      if (err.statusCode === 403) {
        const { userId } = await auth();
        const isSignedIn = !!userId;
        // Render the lesson's public facts (as listed on the course page) so
        // each locked lesson is a distinct page rather than an identical
        // sign-in wall. No gated content (video, transcript, snippets) is shown.
        const publicMeta = await getLessonPublicMeta(slug, lessonSlug);
        const minutes = publicMeta?.durationSeconds
          ? Math.max(1, Math.round(publicMeta.durationSeconds / 60))
          : null;
        return (
          <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
            {publicMeta && (
              <>
                <h1 className="mb-2 text-2xl font-bold">{publicMeta.title}</h1>
                <p className="mb-4 text-sm text-muted-foreground">
                  Lesson in{" "}
                  <Link
                    href={`/courses/${slug}`}
                    className="underline underline-offset-4 hover:text-foreground"
                  >
                    {publicMeta.courseTitle}
                  </Link>
                  {minutes ? ` · ${minutes} min` : null}
                </p>
                {publicMeta.description && (
                  <p className="mb-8 max-w-xl text-muted-foreground">
                    {publicMeta.description}
                  </p>
                )}
              </>
            )}
            {publicMeta ? (
              <h2 className="mb-4 text-xl font-semibold">
                {isSignedIn ? "Subscription required" : "Sign in to continue"}
              </h2>
            ) : (
              <h1 className="mb-4 text-2xl font-bold">
                {isSignedIn ? "Subscription required" : "Sign in to continue"}
              </h1>
            )}
            <p className="mb-6 text-muted-foreground">
              {err.message ?? "This lesson requires authentication or an active subscription."}
            </p>
            <div className="flex gap-3">
              <Link href={`/courses/${slug}`}>
                <Button variant="outline">Back to course</Button>
              </Link>
              {isSignedIn ? (
                <CheckoutButton>Subscribe Now</CheckoutButton>
              ) : (
                <Link href="/sign-in">
                  <Button>Sign in</Button>
                </Link>
              )}
            </div>
          </div>
        );
      }
      throw error;
    }
    throw error;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageEventTracker
        event="view_lesson"
        params={{
          course_slug: slug,
          lesson_slug: lessonSlug,
          lesson_title: lesson.title,
        }}
      />
      {/* Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href={`/courses/${slug}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to course
        </Link>
        <div className="flex items-center gap-2">
          {lesson.previousLesson && (
            <Button variant="outline" size="sm" asChild>
              <Link
                href={`/courses/${slug}/lessons/${lesson.previousLesson.slug}`}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Link>
            </Button>
          )}
          {lesson.nextLesson && (
            <Button variant="outline" size="sm" asChild>
              <Link
                href={`/courses/${slug}/lessons/${lesson.nextLesson.slug}`}
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      <h1 className="mb-6 text-2xl font-bold">{lesson.title}</h1>

      {/* Video Player */}
      {lesson.videoPlaybackId && (
        <LessonPlayerClient
          lessonId={lesson.id}
          playbackId={lesson.videoPlaybackId}
          tokens={generateMuxTokens(lesson.videoPlaybackId)}
          title={lesson.title}
          startTime={lesson.userProgress?.videoPositionSeconds ?? 0}
          isCompleted={lesson.userProgress?.completed ?? false}
          courseSlug={slug}
          lessonSlug={lessonSlug}
        />
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Code Snippets */}
          {lesson.codeSnippets && lesson.codeSnippets.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-semibold">Code Snippets</h2>
              <div className="space-y-4">
                {lesson.codeSnippets.map((snippet, i) => (
                  <CodeSnippet
                    key={i}
                    label={snippet.label}
                    language={snippet.language}
                    code={snippet.code}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Transcript */}
          {lesson.transcript && (
            <TranscriptPanel transcript={lesson.transcript} />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Resources */}
          {lesson.resources && lesson.resources.length > 0 && (
            <ResourceList resources={lesson.resources} />
          )}

          {/* Lab launch */}
          {lesson.labDefinitionId && (
            <LabLauncher
              labDefinitionId={lesson.labDefinitionId}
              courseSlug={slug}
              lessonSlug={lessonSlug}
            />
          )}
        </div>
      </div>
    </div>
  );
}
