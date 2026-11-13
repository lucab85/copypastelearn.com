export const revalidate = 3600;
import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCourse } from "@/server/queries/courses";
import { getPublicCourses } from "@/server/queries/public-courses";
import { CourseCard } from "@/components/course/course-card";
import { COURSE_TRACKS } from "@/lib/course-tracks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Clock, BookOpen, Lock, CheckCircle2, Play, Target, Users, ClipboardCheck, FlaskConical, Download, ChevronDown } from "lucide-react";
import { VideoPlayer } from "@/components/lesson/video-player";
import { PageEventTracker } from "@/components/analytics/page-event-tracker";
import { TerminalPreview } from "@/components/course/terminal-preview";
import { COPYPASTELEARN, LUCA_BERTON, OPEN_EMPOWER } from "@/lib/entities";

// Per-request memoization so generateMetadata + the page body share one DB call.
const loadCourse = cache(getCourse);

interface CourseDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CourseDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await loadCourse(slug);
  if (!course) return {};
  const siteUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://www.copypastelearn.com";
  // Keep the rendered <title> within 60 chars. The root layout appends
  // " — CopyPasteLearn" (17 chars); when the course title is long, render it
  // standalone (absolute) so the branded suffix doesn't push past 60.
  const brandedTitleLength = course.title.length + " — CopyPasteLearn".length;
  // Facebook, LinkedIn and X don't render SVG. For an SVG thumbnail, leave the
  // share image to the generated opengraph-image card in this folder (Next.js
  // uses it whenever metadata sets none). No size tags: thumbnails vary.
  const shareImage =
    course.thumbnailUrl && !/\.svg(\?|$)/i.test(course.thumbnailUrl)
      ? course.thumbnailUrl.startsWith("http")
        ? course.thumbnailUrl
        : `${siteUrl}${course.thumbnailUrl}`
      : null;
  return {
    title: brandedTitleLength > 60 ? { absolute: course.title } : course.title,
    description: course.description
      ? course.description.length > 160
        ? course.description.slice(0, 157) + "..."
        : course.description
      : undefined,
    alternates: { canonical: `/courses/${slug}` },
    openGraph: {
      url: `/courses/${slug}`,
      title: course.title,
      description: course.description
        ? course.description.length > 160
          ? course.description.slice(0, 157) + "..."
          : course.description
        : undefined,
      type: "website",
      ...(shareImage && { images: [{ url: shareImage, alt: course.title }] }),
    },
    twitter: {
      card: "summary_large_image" as const,
      site: "@copypastelearn",
      creator: "@TheLucaBerton",
      title: course.title,
      description: course.description
        ? course.description.length > 160
          ? course.description.slice(0, 157) + "..."
          : course.description
        : undefined,
      ...(shareImage && { images: [shareImage] }),
    },
  };
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { slug } = await params;
  const course = await loadCourse(slug);

  if (!course) {
    notFound();
  }

  // Lessons grouped by module, in course order. A course with no module
  // numbers is one unnamed group.
  const modules: {
    number: number | null;
    title: string | null;
    lessons: { lesson: (typeof course.lessons)[number]; index: number }[];
  }[] = [];
  course.lessons.forEach((lesson, index) => {
    const number = lesson.moduleNumber ?? null;
    const last = modules[modules.length - 1];
    if (last && last.number === number) {
      last.lessons.push({ lesson, index });
      last.title ??= lesson.moduleTitle ?? null;
    } else {
      modules.push({ number, title: lesson.moduleTitle ?? null, lessons: [{ lesson, index }] });
    }
  });

  const moduleMinutes = (module: (typeof modules)[number]) =>
    Math.round(
      module.lessons.reduce((sum, { lesson }) => sum + (lesson.durationSeconds ?? 0), 0) / 60
    );

  // Other published courses of the same track (Coursera/Udemy: "more like this").
  const track = COURSE_TRACKS.find((t) => t.id === course.track);
  const related = track
    ? (await getPublicCourses())
        .filter((c) => c.track === course.track && c.slug !== course.slug)
        .slice(0, 3)
    : [];

  const totalDuration = course.lessons.reduce(
    (acc, l) => acc + (l.durationSeconds ?? 0),
    0
  );
  const hours = Math.floor(totalDuration / 3600);
  const minutes = Math.floor((totalDuration % 3600) / 60);

  const siteUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://www.copypastelearn.com";

  const difficultyToLevel: Record<string, string> = {
    BEGINNER: "Beginner",
    INTERMEDIATE: "Intermediate",
    ADVANCED: "Advanced",
  };

  const courseJsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description,
    url: `${siteUrl}/courses/${slug}`,
    // One identity across Luca's sites: see src/lib/entities.ts.
    provider: COPYPASTELEARN,
    ...(course.thumbnailUrl && {
      image: course.thumbnailUrl.startsWith("http")
        ? course.thumbnailUrl
        : `${siteUrl}${course.thumbnailUrl}`,
    }),
    educationalLevel: difficultyToLevel[course.difficulty] ?? course.difficulty,
    numberOfLessons: course.lessons.length,
    ...(totalDuration > 0 && {
      timeRequired: `PT${hours > 0 ? `${hours}H` : ""}${minutes}M`,
    }),
    teaches: course.outcomes,
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "Online",
      courseWorkload: totalDuration > 0
        ? `PT${hours > 0 ? `${hours}H` : ""}${minutes}M`
        : undefined,
      instructor: LUCA_BERTON,
    },
    inLanguage: "en",
    syllabusSections: course.lessons.map((lesson, index) => ({
      "@type": "Syllabus",
      name: lesson.title,
      position: index + 1,
    })),
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      ...(course.outcomes.length > 0
        ? [
            {
              "@type": "Question",
              name: `What will I learn in ${course.title}?`,
              acceptedAnswer: {
                "@type": "Answer",
                text: course.outcomes.join(". ") + ".",
              },
            },
          ]
        : []),
      {
        "@type": "Question",
        name: `How many lessons are in ${course.title}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `This course contains ${course.lessons.length} ${course.lessons.length === 1 ? "lesson" : "lessons"}${totalDuration > 0 ? ` with a total duration of ${hours > 0 ? `${hours} hours and ` : ""}${minutes} minutes` : ""}.`,
        },
      },
      {
        "@type": "Question",
        name: "Is there a free trial?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes! The first lesson of every course is free. You can start learning right away without signing up for a paid plan.",
        },
      },
      ...(course.prerequisites.length > 0
        ? [
            {
              "@type": "Question",
              name: `What are the prerequisites for ${course.title}?`,
              acceptedAnswer: {
                "@type": "Answer",
                text: course.prerequisites.join(". ") + ".",
              },
            },
          ]
        : []),
      {
        "@type": "Question",
        name: "Do I get hands-on practice?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes — courses include interactive labs where you practice in real environments directly in your browser.",
        },
      },
    ],
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Courses",
        item: `${siteUrl}/courses`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: course.title,
        item: `${siteUrl}/courses/${slug}`,
      },
    ],
  };

  return (
    <div className="container mx-auto px-4 pb-28 pt-12 lg:pb-12">
      <PageEventTracker
        event="view_course"
        params={{ course_slug: course.slug, course_title: course.title }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Breadcrumb nav */}
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/" className="transition-colors hover:text-foreground">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/courses" className="transition-colors hover:text-foreground">
              Courses
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-medium text-foreground truncate max-w-[200px]">
            {course.title}
          </li>
        </ol>
      </nav>

      {/* Hero */}
      <div className="mb-8">
        <Badge variant="secondary" className="mb-3">
          {course.difficulty.toLowerCase()}
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight">{course.title}</h1>
        <div className="mt-3 max-w-2xl space-y-3 text-lg text-muted-foreground">
          {course.description.split(/\n\s*\n/).map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            {course.lessons.length}{" "}
            {course.lessons.length === 1 ? "lesson" : "lessons"}
          </span>
          {totalDuration > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {hours > 0 && `${hours}h `}
              {minutes}m
            </span>
          )}
          {course.contentUpdatedAt && (
            <span>
              Updated{" "}
              {new Date(course.contentUpdatedAt).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
                timeZone: "UTC",
              })}
            </span>
          )}
        </div>

        {course.userProgress && (
          <div className="mt-4 max-w-md">
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>Your progress</span>
              <span>{Math.round(course.userProgress.percentComplete)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${course.userProgress.percentComplete}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Course promo */}
          {course.trailerPlaybackId && (
            <section aria-label="Course trailer" className="mb-8 overflow-hidden rounded-lg border">
              <VideoPlayer
                playbackId={course.trailerPlaybackId}
                title={`${course.title}: trailer`}
                courseSlug={course.slug}
                lessonSlug="trailer"
              />
            </section>
          )}

          {/* Outcomes */}
          {course.outcomes.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold">What you&apos;ll learn</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {course.outcomes.map((outcome, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-sm">{outcome}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Terminal preview */}
          <TerminalPreview courseSlug={slug} />

          {/* Who this is for */}
          <section className="mb-8 rounded-lg border bg-muted/30 p-6">
            <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold">
              <Users className="h-5 w-5 text-primary" />
              Who this is for
            </h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {course.difficulty === "BEGINNER" ? (
                <>
                  <li>• Developers moving into DevOps or infrastructure roles</li>
                  <li>• System administrators learning modern tooling</li>
                  <li>• CS students building practical skills</li>
                </>
              ) : course.difficulty === "INTERMEDIATE" ? (
                <>
                  <li>• DevOps engineers deepening their expertise</li>
                  <li>• SREs building production-grade systems</li>
                  <li>• Backend developers expanding into infrastructure</li>
                </>
              ) : (
                <>
                  <li>• Senior engineers architecting complex systems</li>
                  <li>• Platform engineers building internal tooling</li>
                  <li>• Tech leads driving infrastructure decisions</li>
                </>
              )}
            </ul>
          </section>

          {/* Prerequisites */}
          {course.prerequisites.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold">Prerequisites</h2>
              <ul className="space-y-1">
                {course.prerequisites.map((prereq, i) => (
                  <li key={i} className="text-sm text-muted-foreground">
                    • {prereq}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <Separator className="my-8" />

          {/* Lesson List */}
          <section>
            <h2 className="mb-1 text-xl font-semibold">Course content</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              {modules.length > 1 ? `${modules.length} modules, ` : ""}
              {course.lessons.length}{" "}
              {course.lessons.length === 1 ? "lesson" : "lessons"}
              {totalDuration > 0 ? `, ${hours > 0 ? `${hours}h ` : ""}${minutes}m of video` : ""}
            </p>
            <div className="space-y-6">
              {modules.map((module) => (
                <details key={module.number ?? "all"} open className="group/module">
                  <summary
                    className={
                      module.number === null
                        ? "hidden"
                        : "mb-2 flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg bg-muted/50 px-4 py-3 [&::-webkit-details-marker]:hidden"
                    }
                  >
                    <h3 className="font-semibold">
                      Module {module.number}
                      {module.title ? `: ${module.title}` : ""}
                    </h3>
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      {module.lessons.length}{" "}
                      {module.lessons.length === 1 ? "lesson" : "lessons"}
                      {moduleMinutes(module) > 0 ? `, ${moduleMinutes(module)} min` : ""}
                      <ChevronDown className="h-4 w-4 transition-transform group-open/module:rotate-180" />
                    </span>
                  </summary>
                  <div className="space-y-2">
                    {module.lessons.map(({ lesson, index }) => (
                    <div
                      key={lesson.id}
                      className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-accent/50"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {lesson.isAccessible ? (
                            <Link
                              href={`/courses/${slug}/lessons/${lesson.slug}`}
                              className="font-medium hover:underline truncate"
                            >
                              {lesson.title}
                            </Link>
                          ) : (
                            <span className="font-medium text-muted-foreground truncate">
                              {lesson.title}
                            </span>
                          )}
                          {lesson.isFree && (
                            <Badge variant="secondary" className="text-xs">
                              Free
                            </Badge>
                          )}
                          {lesson.hasLab && (
                            <Badge variant="outline" className="text-xs">
                              Lab
                            </Badge>
                          )}
                        </div>
                        {lesson.durationSeconds && (
                          <p className="text-xs text-muted-foreground">
                            {Math.ceil(lesson.durationSeconds / 60)} min
                          </p>
                        )}
                        {lesson.description && (
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                            {lesson.description}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0">
                        {lesson.userProgress?.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        ) : !lesson.isAccessible ? (
                          <Lock className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <Play className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    ))}
                  </div>
                </details>
              ))}

              {(course.hasLabGuide || course.hasAssessment) && (
                <div>
                  <h3 className="mb-2 rounded-lg bg-muted/50 px-4 py-3 font-semibold">
                    Practice
                  </h3>
                  <div className="space-y-2">
                    {course.hasLabGuide && (
                      <Link
                        href={`/courses/${slug}/lab`}
                        className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-accent/50"
                      >
                        <FlaskConical className="h-5 w-5 shrink-0 text-muted-foreground" />
                        <span className="flex-1">
                          <span className="font-medium">Hands-on lab</span>
                          <span className="block text-sm text-muted-foreground">
                            One scenario that uses the whole course, step by step
                          </span>
                        </span>
                        <Lock className="h-5 w-5 shrink-0 text-muted-foreground" />
                      </Link>
                    )}
                    {course.hasAssessment && (
                      <Link
                        href={`/courses/${slug}/assessment`}
                        className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-accent/50"
                      >
                        <ClipboardCheck className="h-5 w-5 shrink-0 text-muted-foreground" />
                        <span className="flex-1">
                          <span className="font-medium">Final assessment</span>
                          <span className="block text-sm text-muted-foreground">
                            Multiple-choice questions, each answer explained
                          </span>
                        </span>
                        <Lock className="h-5 w-5 shrink-0 text-muted-foreground" />
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 space-y-6 rounded-lg border p-6">
            <h2 className="mb-4 text-lg font-semibold">Get started</h2>
            {course.lessons.length > 0 && (
              <Button asChild className="w-full">
                <Link
                  href={`/courses/${slug}/lessons/${course.lessons[0].slug}`}
                >
                  {course.userProgress
                    ? "Continue Learning"
                    : "Start Free Lesson"}
                </Link>
              </Button>
            )}
            <p className="mt-3 text-center text-xs text-muted-foreground">
              First lesson is always free — no signup required
            </p>

            <Separator />

            {/* Course highlights */}
            <h3 className="text-sm font-semibold">This course includes</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span>{course.lessons.length} hands-on lessons</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span>{difficultyToLevel[course.difficulty] ?? course.difficulty} level</span>
              </div>
              {totalDuration > 0 && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{hours > 0 ? `${hours}h ` : ""}{minutes}m total</span>
                </div>
              )}
              {course.lessons.some((l) => l.hasLab) && (
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4 text-muted-foreground" />
                  <span>Real Linux sandbox labs</span>
                </div>
              )}
              {course.hasLabGuide && (
                <Link
                  href={`/courses/${slug}/lab`}
                  className="flex items-center gap-2 hover:text-primary"
                >
                  <FlaskConical className="h-4 w-4 text-muted-foreground" />
                  <span className="underline-offset-4 hover:underline">Hands-on lab</span>
                </Link>
              )}
              {course.hasAssessment && (
                <Link
                  href={`/courses/${slug}/assessment`}
                  className="flex items-center gap-2 hover:text-primary"
                >
                  <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                  <span className="underline-offset-4 hover:underline">Final assessment</span>
                </Link>
              )}
            </div>

            {course.companionProducts && course.companionProducts.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="mb-3 text-sm font-semibold">Goes with this course</h3>
                  <ul className="space-y-3">
                    {course.companionProducts.map((p) => (
                      <li key={p.slug}>
                        <Link
                          href={`/products/${p.slug}`}
                          className="group flex items-start gap-2 text-sm"
                        >
                          <Download className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          <span>
                            <span className="font-medium group-hover:underline">{p.title}</span>
                            <span className="block text-xs text-muted-foreground">
                              {new Intl.NumberFormat("en-IE", {
                                style: "currency",
                                currency: p.currency.toUpperCase(),
                              }).format(p.priceAmount / 100)}
                              , one-time
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            <Separator />

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Want all courses?
              </p>
              <Link
                href="/pricing"
                className="text-sm font-medium text-primary hover:underline"
              >
                See Pro plan →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Instructor */}
      <section className="mt-16 max-w-2xl border-t pt-10">
        <h2 className="text-xl font-semibold">Your instructor</h2>
        <p className="mt-3 font-medium">
          <a href={LUCA_BERTON.url} className="hover:underline" rel="author">
            {LUCA_BERTON.name}
          </a>
        </p>
        <p className="mt-1 text-muted-foreground">
          {LUCA_BERTON.jobTitle}, {OPEN_EMPOWER.name}.{" "}
          <Link href="/about" className="text-foreground underline underline-offset-4">
            About the author
          </Link>
        </p>
      </section>

      {/* More in this track */}
      {track && related.length > 0 && (
        <section className="mt-16 border-t pt-10">
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-xl font-semibold">More in {track.title}</h2>
            <Link
              href={`/courses#${track.anchor}`}
              className="text-sm font-medium text-primary hover:underline"
            >
              All courses in this track
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        </section>
      )}

      {/* Phone: the start button stays in reach (the sidebar is far below) */}
      {course.lessons.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background p-3 lg:hidden">
          <Button asChild className="w-full">
            <Link href={`/courses/${slug}/lessons/${course.lessons[0].slug}`}>
              {course.userProgress ? "Continue Learning" : "Start Free Lesson"}
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
