import { notFound, redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
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
          title: true,
          yamlConfig: true,
          lesson: {
            select: {
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

  // Parse steps from config
  let steps: { title: string; instructions: string }[] = [];
  try {
    const config = JSON.parse(session.labDefinition.yamlConfig);
    steps = (config.steps ?? []).map(
      (s: { title?: string; instructions?: string }, i: number) => ({
        title: s.title ?? `Step ${i + 1}`,
        instructions: s.instructions ?? "",
      })
    );
  } catch {
    steps = [{ title: "Step 1", instructions: "Follow the instructions." }];
  }

  const courseSlug = session.labDefinition.lesson?.course?.slug;
  const lessonSlug = session.labDefinition.lesson?.slug;
  const backUrl =
    courseSlug && lessonSlug
      ? `/courses/${courseSlug}/lessons/${lessonSlug}`
      : "/courses";

  return (
    <LabPageClient
      sessionId={session.id}
      labTitle={session.labDefinition.title}
      steps={steps}
      currentStepIndex={session.currentStepIndex}
      backUrl={backUrl}
    />
  );
}
