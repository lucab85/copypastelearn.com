import { LessonForm } from "@/components/admin/lesson-form";

interface NewLessonPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "New Lesson" };

export default async function NewLessonPage({ params }: NewLessonPageProps) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Add New Lesson</h1>
      <LessonForm courseId={id} />
    </div>
  );
}
