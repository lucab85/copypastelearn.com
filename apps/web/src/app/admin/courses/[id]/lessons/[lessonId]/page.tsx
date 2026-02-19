import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { LessonForm } from "@/components/admin/lesson-form";
import { LabDefinitionEditor } from "@/components/admin/lab-definition-editor";
import { Separator } from "@/components/ui/separator";

interface LessonEditPageProps {
  params: Promise<{ id: string; lessonId: string }>;
}

export default async function LessonEditPage({ params }: LessonEditPageProps) {
  const { id: courseId, lessonId } = await params;

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: {
      labDefinition: true,
    },
  });

  if (!lesson || lesson.courseId !== courseId) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <LessonForm
        courseId={courseId}
        lesson={{
          id: lesson.id,
          title: lesson.title,
          description: lesson.description ?? "",
          videoPlaybackId: lesson.videoPlaybackId,
          transcript: lesson.transcript,
          codeSnippets: lesson.codeSnippets,
          resources: lesson.resources,
          durationSeconds: lesson.durationSeconds,
          status: lesson.status,
        }}
      />

      <Separator />

      {/* Lab Definition Editor (T068) */}
      {(() => {
        const plan = lesson.labDefinition?.compiledPlan as Record<string, unknown> | null;
        const env = lesson.labDefinition?.envConfig as Record<string, unknown> | null;
        return (
          <LabDefinitionEditor
            lessonId={lessonId}
            labDefinition={
              lesson.labDefinition
                ? {
                    title: (plan?.title as string) ?? "",
                    description: (plan?.description as string) ?? null,
                    yamlConfig: lesson.labDefinition.yamlSource,
                    dockerImage: (env?.image as string) ?? (plan?.dockerImage as string) ?? "ubuntu:22.04",
                    memoryLimit: (env?.memoryLimit as string) ?? (plan?.memoryLimit as string) ?? null,
                    cpuLimit: (env?.cpuLimit as string) ?? (plan?.cpuLimit as string) ?? null,
                  }
                : null
            }
          />
        );
      })()}
    </div>
  );
}
