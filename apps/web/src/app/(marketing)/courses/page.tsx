import type { Metadata } from "next";
import { getCourses } from "@/server/queries/courses";
import { CourseCard } from "@/components/course/course-card";
import { BookOpen } from "lucide-react";

export const revalidate = 3600; // ISR: revalidate every hour

export const metadata: Metadata = {
  title: "Courses — IT Automation & DevOps Training",
  description:
    "Browse hands-on courses on Docker, Ansible, Node.js and more. Each course includes video lessons and interactive labs.",
  alternates: { canonical: "/courses" },
  openGraph: {
    title: "Courses — IT Automation & DevOps Training",
    description:
      "Browse hands-on courses on Docker, Ansible, Node.js and more. Each course includes video lessons and interactive labs.",
  },
};

export default async function CourseCatalogPage() {
  const courses = await getCourses();

  const siteUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://www.copypastelearn.com";

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "IT Automation & DevOps Courses",
    description:
      "Browse hands-on courses on Docker, Ansible, Node.js and more.",
    url: `${siteUrl}/courses`,
    numberOfItems: courses.length,
    itemListElement: courses.map((course, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${siteUrl}/courses/${course.slug}`,
      name: course.title,
      description: course.description,
      ...(course.thumbnailUrl && { image: course.thumbnailUrl }),
    })),
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      {/* Page header */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-12 lg:py-16">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Course Catalog
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            Master IT automation with video courses and hands-on interactive
            labs. Pick a course and start learning today.
          </p>
        </div>
      </div>

      {/* Course grid */}
      <div className="container mx-auto px-4 py-12">
        {courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20">
            <BookOpen className="mb-4 h-10 w-10 text-muted-foreground/50" />
            <p className="text-lg font-medium text-muted-foreground">
              No courses available yet.
            </p>
            <p className="mt-1 text-sm text-muted-foreground/70">
              Check back soon — new courses are on the way!
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
