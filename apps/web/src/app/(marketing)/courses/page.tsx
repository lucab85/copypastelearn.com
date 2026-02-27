export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { getPublicCourses } from "@/server/queries/public-courses";
import { CourseFilter } from "@/components/course/course-filter";
import { BookOpen } from "lucide-react";
import { PageEventTracker } from "@/components/analytics/page-event-tracker";

export const revalidate = 3600;

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
  twitter: {
    card: "summary_large_image",
    site: "@copypastelearn",
    creator: "@yourlinuxsa",
    title: "Courses — IT Automation & DevOps Training",
    description:
      "Browse hands-on courses on Docker, Ansible, Node.js and more. Each course includes video lessons and interactive labs.",
  },
};

export default async function CourseCatalogPage() {
  const courses = await getPublicCourses();

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
      ...(course.thumbnailUrl && {
        image: course.thumbnailUrl.startsWith("http")
          ? course.thumbnailUrl
          : `${siteUrl}${course.thumbnailUrl}`,
      }),
    })),
  };

  return (
    <div>
      <PageEventTracker
        event="view_courses_list"
        params={{ course_count: courses.length }}
      />
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

      {/* Learning Paths */}
      <div className="border-b bg-muted/10">
        <div className="container mx-auto px-4 py-10">
          <h2 className="mb-6 text-xl font-semibold">Learning Paths</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "DevOps Foundations",
                description:
                  "Docker → Ansible → CI/CD. Build a complete automation workflow from scratch.",
                courses: ["Docker Fundamentals", "Ansible Quickstart"],
                color: "from-blue-500/10 to-cyan-500/10",
                border: "border-blue-500/20",
              },
              {
                title: "Infrastructure as Code",
                description:
                  "Terraform + Ansible. Provision and configure cloud infrastructure programmatically.",
                courses: [
                  "Terraform for Beginners",
                  "Ansible Quickstart",
                ],
                color: "from-purple-500/10 to-pink-500/10",
                border: "border-purple-500/20",
              },
              {
                title: "AI & MLOps",
                description:
                  "From AI agents to ML model lifecycle management on Kubernetes.",
                courses: [
                  "OpenClaw AI Agent",
                  "MLflow for Kubernetes",
                ],
                color: "from-orange-500/10 to-yellow-500/10",
                border: "border-orange-500/20",
              },
            ].map((path) => (
              <div
                key={path.title}
                className={`rounded-xl border ${path.border} bg-gradient-to-br ${path.color} p-5`}
              >
                <h3 className="font-semibold">{path.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {path.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {path.courses.map((c) => (
                    <span
                      key={c}
                      className="rounded-full bg-background/60 px-2.5 py-0.5 text-xs font-medium"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Course grid with filters */}
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
          <CourseFilter courses={courses} />
        )}
      </div>
    </div>
  );
}
