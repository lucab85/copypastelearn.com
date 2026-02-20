import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getLesson } from "@/server/queries/lessons";
import { generateMuxTokens } from "@/lib/mux";
import { LessonPlayerClient } from "./lesson-player-client";
import { TranscriptPanel } from "@/components/lesson/transcript-panel";
import { CodeSnippet } from "@/components/lesson/code-snippet";
import { ResourceList } from "@/components/lesson/resource-list";
import { LabLauncher } from "./lab-launcher";
import { Button } from "@/components/ui/button";
import { CheckoutButton } from "@/components/checkout-button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const metadata = {
  robots: { index: false, follow: false },
};

interface LessonPageProps {
  params: Promise<{ slug: string; lessonSlug: string }>;
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { slug, lessonSlug } = await params;

  let lesson;
  try {
    lesson = await getLesson(slug, lessonSlug);
  } catch (error: unknown) {
    if (error && typeof error === "object" && "statusCode" in error) {
      const err = error as { statusCode: number; message?: string };
      if (err.statusCode === 404) notFound();
      if (err.statusCode === 403) {
        const { userId } = await auth();
        const isSignedIn = !!userId;
        return (
          <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
            <h1 className="mb-4 text-2xl font-bold">
              {isSignedIn ? "Subscription required" : "Sign in to continue"}
            </h1>
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
