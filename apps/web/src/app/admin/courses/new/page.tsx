import { CourseForm } from "@/components/admin/course-form";

export const metadata = { title: "New Course" };

export default function NewCoursePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Create New Course</h1>
      <CourseForm />
    </div>
  );
}
