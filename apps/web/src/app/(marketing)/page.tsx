import Link from "next/link";
import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, Bot, KeyRound, Library } from "lucide-react";
import { COPYPASTELEARN } from "@/lib/entities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getPublicCourses,
  getUpcomingCourses,
} from "@/server/queries/public-courses";
import { HeroTerminal } from "@/components/home/hero-terminal";
import { PromoBento, type Promo } from "@/components/home/promo-bento";
import { ExplorePills } from "@/components/home/explore-pills";
import { CourseColumns } from "@/components/home/course-columns";
import { TrackSpotlight } from "@/components/home/track-spotlight";
import { IntentBuckets, type Bucket } from "@/components/home/intent-buckets";
import { GoalChooser, type Goal } from "@/components/home/goal-chooser";
import { HomeFaq } from "@/components/home/home-faq";
import { HERO_DEMOS } from "@/lib/hero-demos";
import { ACADEMY_COURSES } from "@/lib/academy";
import { HOME_FAQ } from "@/lib/home-faq";
import {
  buildHomeColumns,
  courseMeta,
  formatMonth,
  latestUpdatedCourse,
  trackCount,
  trackGroups,
} from "@/lib/home-catalog";
import { getAllPosts } from "@/lib/blog";
import { getAllCategories } from "@/lib/blog-taxonomy";

export const revalidate = 3600;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  // Use the same relative "/" as the canonical so Next resolves both through
  // metadataBase identically (keeps og:url and canonical byte-for-byte equal).
  openGraph: { url: "/", type: "website" },
};

/* ─── Structured Data ──────────────────────────────── */

function OrganizationJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    // Founder (Luca Berton) and parent (Open Empower): see src/lib/entities.ts.
    ...COPYPASTELEARN,
    description:
      "Master IT automation with video courses and practical examples.",
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

function WebSiteJsonLd() {
  const siteUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://www.copypastelearn.com";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "CopyPasteLearn",
    url: siteUrl,
    description:
      "Master IT automation with video courses and practical examples. Practice the examples in your own environment.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/courses?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

/* ─── Page Component ───────────────────────────────── */

export default async function HomePage() {
  const [courses, upcoming] = await Promise.all([
    getPublicCourses(),
    getUpcomingCourses(),
  ]);
  const recentPosts = getAllPosts().slice(0, 6);

  // Hero demos link to their course only when it is published.
  const heroDemos = HERO_DEMOS.map(({ slug, ...demo }) => ({
    ...demo,
    href: courses.some((c) => c.slug === slug) ? `/courses/${slug}` : null,
  }));

  // Everything below is built from published courses and announced drafts:
  // a section with nothing real to show is left out.
  const groups = trackGroups(courses, upcoming);
  const bySlug = new Map(courses.map((c) => [c.slug, c]));
  const academy = ACADEMY_COURSES.flatMap((c) => bySlug.get(c.slug) ?? []);
  const academyCount = `${academy.length} ${academy.length === 1 ? "course" : "courses"}`;
  const latest = latestUpdatedCourse(
    courses,
    academy.slice(0, 1).map((c) => c.slug)
  );

  const promos: Promo[] = [];
  if (academy.length > 0) {
    promos.push({
      id: "academy",
      kicker: "Agentic AI Academy",
      title: "Learn the tools that run AI agents in production",
      text: `${academyCount}. Watch the commands run and repeat them in your own environment.`,
      href: "/academy",
      cta: "Explore the Academy",
      image: academy[0].thumbnailUrl,
      accent: "amber",
    });
  }
  if (latest?.updatedAt) {
    promos.push({
      id: "latest",
      kicker: `Updated ${formatMonth(latest.updatedAt)}`,
      title: latest.title,
      text: courseMeta(latest),
      href: `/courses/${latest.slug}`,
      cta: "See the course",
      image: latest.thumbnailUrl,
      accent: "emerald",
    });
  }

  const buckets: Bucket[] = [
    ...(academy.length > 0
      ? [
          {
            href: "/academy",
            title: "Agentic AI Academy",
            text: `${academyCount} on the tools that run AI agents in production.`,
            icon: Bot,
            tone: "amber" as const,
          },
        ]
      : []),
    {
      href: "/courses",
      title: "All courses",
      text: "Video courses you can follow command by command.",
      icon: Library,
      tone: "emerald",
    },
    {
      href: "/pricing",
      title: "Membership",
      text: "Subscribe to unlock every lesson and available final assessments.",
      icon: KeyRound,
      tone: "slate",
    },
  ];

  const goals: Goal[] = [
    ...groups.map(({ track, courses: published, upcoming: soon }) => ({
      href: `/courses#${track.anchor}`,
      title: track.tagline,
      target: track.title,
      meta: trackCount(published.length, soon.length),
    })),
    {
      href: "/courses",
      title: "Watch one free lesson, then decide",
      target: "All courses",
      meta: "No signup, no card",
    },
  ];

  const pillGroups = [
    {
      label: "Courses",
      links: [
        { href: "/courses", label: "All courses" },
        ...groups.map(({ track }) => ({
          href: `/courses#${track.anchor}`,
          label: track.title,
        })),
        ...(academy.length > 0
          ? [{ href: "/academy", label: "Agentic AI Academy" }]
          : []),
      ],
    },
    {
      label: "Articles",
      links: [
        ...getAllCategories().map((c) => ({
          href: `/blog/category/${c.slug}`,
          label: c.name,
        })),
        { href: "/blog", label: "All articles" },
      ],
    },
  ];

  return (
    <div className="flex flex-col">
      <OrganizationJsonLd />
      <WebSiteJsonLd />

      {/* Promo cards: the promise with a lesson clip, the Academy, the latest course */}
      <PromoBento promos={promos} />

      {/* Pill links: tracks and article categories */}
      <ExplorePills groups={pillGroups} />

      {/* Three short lists of courses */}
      <CourseColumns columns={buildHomeColumns(courses)} />

      {/* Dark band: tracks as chips, four cards of the chosen track */}
      <TrackSpotlight
        tracks={groups.map(({ track, courses: published, upcoming: soon }) => ({
          anchor: track.anchor,
          title: track.title,
          tagline: track.tagline,
          count: trackCount(published.length, soon.length),
          courses: published.slice(0, 4),
          upcoming: soon.slice(0, Math.max(0, 4 - published.length)),
        }))}
      />

      {/* Three large links: Academy, catalog, membership */}
      <IntentBuckets buckets={buckets} />

      {/* ═══════════════ TRY IT ═══════════════════════════════ */}
      <section aria-label="Try a command" className="border-t border-white/10 bg-[#0b1120] pb-16 text-white lg:pb-24">
        <div className="container mx-auto grid items-center gap-8 px-4 pt-12 lg:grid-cols-[1fr_1.4fr] lg:gap-14 lg:pt-16">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Try it before you watch
            </h2>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-slate-300">
              Pick a course, copy the command, see what it prints. These are
              command outputs recorded during the lessons.
            </p>
          </div>
          <HeroTerminal demos={heroDemos} />
        </div>
      </section>

      {/* Goal chooser: each answer links to its track */}
      <GoalChooser goals={goals} />

      {/* ═══════════════ INSTRUCTOR ═══════════════════════════ */}
      <section aria-label="Instructor" className="border-b py-12 lg:py-16">
        <div className="container mx-auto grid items-center gap-8 px-4 sm:grid-cols-[auto_1fr] lg:gap-14">
          <Image
            src="/images/luca-berton.jpg"
            alt="Luca Berton"
            width={480}
            height={672}
            sizes="(min-width: 640px) 240px, 160px"
            className="h-auto w-40 rounded-xl sm:w-60"
          />
          <div className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
            <h2 className="mb-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Taught by someone who runs this for a living
            </h2>
            <p>
              <span className="font-semibold text-foreground">Luca Berton</span>{" "}
              is the author of Ansible Pilot and Ansible By Example, a Docker
              Captain, and a speaker at Red Hat Summit 2026. Every lesson
              comes from a system he built and runs himself.
            </p>
            <p className="mt-4">
              <Link
                href="/about"
                className="font-medium text-foreground underline underline-offset-4"
              >
                About Luca and CopyPasteLearn
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════ LATEST FROM THE BLOG ════════════════ */}
      <section aria-label="Latest articles" className="border-t py-20 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Latest from the Blog
              </h2>
              <p className="mt-3 max-w-xl text-lg text-muted-foreground">
                Tutorials, guides, and insights on DevOps, automation, and cloud infrastructure.
              </p>
            </div>
            <Button variant="outline" className="hidden gap-2 sm:flex" asChild>
              <Link href="/blog">
                View all articles
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recentPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col rounded-xl border bg-card p-6 transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="text-xs">
                    {post.category}
                  </Badge>
                  <span>
                    {new Date(post.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-semibold leading-snug transition-colors group-hover:text-primary">
                  {post.title}
                </h3>
                <p className="mb-4 line-clamp-2 flex-1 text-sm text-muted-foreground">
                  {post.description}
                </p>
                <span className="flex items-center gap-1 text-sm font-medium text-primary">
                  Read more
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Button variant="outline" className="gap-2" asChild>
              <Link href="/blog">
                View all articles
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ with FAQPage structured data */}
      <HomeFaq items={HOME_FAQ} />
    </div>
  );
}
