import { getCourses } from "@/server/queries/courses";
import { CourseCard } from "@/components/course/course-card";

export const revalidate = 3600; // ISR: revalidate every hour

export default async function CourseCatalogPage() {
  const courses = await getCourses();

  return (
    <main className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Course Catalog</h1>
        <p className="mt-2 text-muted-foreground">
          Master IT automation with video courses and hands-on interactive labs.
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-lg text-muted-foreground">
            No courses available yet. Check back soon!
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </main>
  );
}
