export const revalidate = 3600;
import type { Metadata } from "next";
import {
  getPublicCourses,
  getUpcomingCourses,
} from "@/server/queries/public-courses";
import { TrackCatalog } from "@/components/course/track-catalog";
import { COURSE_TRACKS } from "@/lib/course-tracks";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import { PageEventTracker } from "@/components/analytics/page-event-tracker";

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
    creator: "@TheLucaBerton",
    title: "Courses — IT Automation & DevOps Training",
    description:
      "Browse hands-on courses on Docker, Ansible, Node.js and more. Each course includes video lessons and interactive labs.",
  },
};

export default async function CourseCatalogPage() {
  const [courses, upcoming] = await Promise.all([
    getPublicCourses(),
    getUpcomingCourses(),
  ]);
  const hasCourses = (id: string) =>
    [...courses, ...upcoming].some((c) =>
      id === "OTHER" ? !c.track : c.track === id
    );
  const tracks = COURSE_TRACKS.filter((t) => hasCourses(t.id));

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
            Video courses you can follow command by command. Pick a track,
            start from any course: the first lesson is free.
          </p>
          {tracks.length > 1 && (
            <nav aria-label="Tracks" className="mt-6 flex flex-wrap gap-2">
              {tracks.map((t) => (
                <Link
                  key={t.id}
                  href={`#${t.anchor}`}
                  className="rounded-full border bg-background px-4 py-1.5 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
                >
                  {t.title}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </div>

      {/* Course grid with filters */}
      <div className="container mx-auto px-4 py-12">
        {courses.length === 0 && upcoming.length === 0 ? (
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
          <TrackCatalog courses={courses} upcoming={upcoming} showFilters />
        )}
      </div>
    </div>
  );
}
