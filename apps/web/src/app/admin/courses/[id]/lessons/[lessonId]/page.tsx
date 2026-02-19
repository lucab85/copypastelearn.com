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
          description: lesson.description,
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
      <LabDefinitionEditor
        lessonId={lessonId}
        labDefinition={
          lesson.labDefinition
            ? {
                title: lesson.labDefinition.title,
                description: lesson.labDefinition.description,
                yamlConfig: lesson.labDefinition.yamlConfig,
                dockerImage: lesson.labDefinition.dockerImage,
                memoryLimit: lesson.labDefinition.memoryLimit,
                cpuLimit: lesson.labDefinition.cpuLimit,
              }
            : null
        }
      />
    </div>
  );
}
