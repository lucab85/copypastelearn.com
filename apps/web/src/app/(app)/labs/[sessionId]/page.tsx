import { notFound, redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sseUrl, terminalWsUrl } from "@/lib/lab-client";
import { LabPageClient } from "./lab-page-client";

interface LabSessionPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function LabSessionPage({ params }: LabSessionPageProps) {
  const { sessionId } = await params;
  const user = await requireAuth();

  const session = await db.labSession.findFirst({
    where: { id: sessionId, userId: user.id },
    include: {
      labDefinition: {
        select: {
          id: true,
          compiledPlan: true,
          lesson: {
            select: {
              title: true,
              slug: true,
              course: {
                select: { slug: true },
              },
            },
          },
        },
      },
    },
  });

  if (!session) notFound();

  // Redirect away from terminal-state sessions
  const terminalStatuses = ["COMPLETED", "EXPIRED", "FAILED", "DESTROYED"];
  if (terminalStatuses.includes(session.status)) {
    const courseSlug = session.labDefinition.lesson?.course?.slug;
    const lessonSlug = session.labDefinition.lesson?.slug;
    const dest =
      courseSlug && lessonSlug
        ? `/courses/${courseSlug}/lessons/${lessonSlug}`
        : "/dashboard";
    redirect(dest);
  }

  // Parse steps from compiled plan
  let steps: { title: string; instructions: string }[] = [];
  try {
    const config = session.labDefinition.compiledPlan as Record<string, unknown>;
    const rawSteps = (config.steps ?? []) as { title?: string; instructions?: string }[];
    steps = rawSteps.map((s, i) => ({
      title: s.title ?? `Step ${i + 1}`,
      instructions: s.instructions ?? "",
    }));
  } catch {
    steps = [{ title: "Step 1", instructions: "Follow the instructions." }];
  }

  const labTitle = session.labDefinition.lesson?.title
    ? `${session.labDefinition.lesson.title} Lab`
    : "Lab Session";
  const courseSlug = session.labDefinition.lesson?.course?.slug;
  const lessonSlug = session.labDefinition.lesson?.slug;
  const backUrl =
    courseSlug && lessonSlug
      ? `/courses/${courseSlug}/lessons/${lessonSlug}`
      : "/courses";

  return (
    <LabPageClient
      sessionId={session.id}
      labTitle={labTitle}
      steps={steps}
      currentStepIndex={session.currentStepIndex}
      backUrl={backUrl}
      sseUrl={sseUrl(session.id)}
      terminalWsUrl={terminalWsUrl(session.id)}
    />
  );
}
