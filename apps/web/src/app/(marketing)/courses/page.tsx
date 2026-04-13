export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { getPublicCourses } from "@/server/queries/public-courses";
import { CourseFilter } from "@/components/course/course-filter";
import { BookOpen, ArrowRight } from "lucide-react";
import Link from "next/link";
import { PageEventTracker } from "@/components/analytics/page-event-tracker";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Courses — IT Automation & DevOps Training",
  description:
    "Browse hands-on courses on Docker, Ansible, Node.js, Terraform, MLflow, and more. Each course includes expert video lessons and interactive labs.",
  alternates: { canonical: "/courses" },
  openGraph: {
    url: "/courses",
    type: "website",
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
          <h2 className="mb-2 text-xl font-semibold">Learning Paths</h2>
          <p className="mb-6 text-sm text-muted-foreground">Follow a structured sequence to build real skills step by step.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "DevOps Starter",
                description:
                  "Container basics → configuration management → infrastructure provisioning. The essential DevOps toolkit.",
                courses: [
                  { name: "Docker Fundamentals", slug: "docker-fundamentals" },
                  { name: "Ansible Quickstart", slug: "ansible-quickstart" },
                  { name: "Terraform for Beginners", slug: "terraform-beginners" },
                ],
                color: "from-blue-500/10 to-cyan-500/10",
                border: "border-blue-500/20",
              },
              {
                title: "Backend to Infrastructure",
                description:
                  "Build APIs, containerize them, then deploy and manage at scale.",
                courses: [
                  { name: "Node.js REST APIs", slug: "nodejs-rest-apis" },
                  { name: "Docker Fundamentals", slug: "docker-fundamentals" },
                  { name: "Terraform for Beginners", slug: "terraform-beginners" },
                ],
                color: "from-green-500/10 to-emerald-500/10",
                border: "border-green-500/20",
              },
              {
                title: "AI & MLOps",
                description:
                  "From AI agents to ML model lifecycle management on Kubernetes.",
                courses: [
                  { name: "OpenClaw AI Agent", slug: "openclaw-agent" },
                  { name: "MLflow for Kubernetes", slug: "mlflow-kubernetes-mlops" },
                ],
                color: "from-orange-500/10 to-yellow-500/10",
                border: "border-orange-500/20",
              },
              {
                title: "Linux Security",
                description:
                  "Harden Linux systems with SELinux policies, contexts, and troubleshooting.",
                courses: [
                  { name: "SELinux for Sysadmins", slug: "selinux-system-admins" },
                  { name: "Ansible Quickstart", slug: "ansible-quickstart" },
                ],
                color: "from-red-500/10 to-pink-500/10",
                border: "border-red-500/20",
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
                <ol className="mt-3 space-y-1.5">
                  {path.courses.map((c, i) => (
                    <li key={c.slug} className="flex items-center gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-background/80 text-[10px] font-bold">{i + 1}</span>
                      <Link href={`/courses/${c.slug}`} className="text-xs font-medium hover:underline">
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ol>
                <Link
                  href={`/courses/${path.courses[0].slug}`}
                  className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  Start path <ArrowRight className="h-3 w-3" />
                </Link>
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
