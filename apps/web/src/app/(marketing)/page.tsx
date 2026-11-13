import Link from "next/link";
import type { Metadata } from "next";
import { COPYPASTELEARN } from "@/lib/entities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getPublicCourses,
  getUpcomingCourses,
} from "@/server/queries/public-courses";
import { TrackCatalog } from "@/components/course/track-catalog";
import { HeroTerminal } from "@/components/home/hero-terminal";
import { HERO_DEMOS } from "@/lib/hero-demos";
import { COURSE_TRACKS } from "@/lib/course-tracks";
import { getAllPosts } from "@/lib/blog";
import {
  BookOpen,
  Terminal,
  Award,
  ArrowRight,
  Play,
  CheckCircle2,
  Users,
  Zap,
  Clock,
  Star,
  Quote,
  Cpu,
  HardDrive,
  Wifi,
} from "lucide-react";

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
      "Master IT automation with video courses and hands-on interactive labs.",
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
      "Master IT automation with video courses and hands-on interactive labs. Learn by doing in real environments.",
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

/* ─── Topic categories ─────────────────────────────── */

/* ─── Testimonials ─────────────────────────────────── */

const testimonials = [
  {
    name: "Marco R.",
    role: "DevOps Engineer",
    company: "Cloud Infrastructure Team",
    text: "The hands-on labs made Ansible click for me in a way video-only courses never could. I automated our entire server provisioning in week 1.",
    outcome: "Automated server provisioning in 1 week",
    rating: 5,
  },
  {
    name: "Sarah K.",
    role: "Backend Developer",
    company: "SaaS Startup",
    text: "Finally a platform that lets me practice Docker commands in a real environment, not just read about them. Shipped my first containerized app in 3 days.",
    outcome: "Containerized first app in 3 days",
    rating: 5,
  },
  {
    name: "James L.",
    role: "SRE",
    company: "Fintech Company",
    text: "I went from zero to deploying containerized services in production after the Docker Fundamentals course. The copy-paste workflow is genius.",
    outcome: "Production deployment in 2 weeks",
    rating: 5,
  },
];

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

  // One tile per track that has something to show, with a cover of the track.
  const trackTiles = COURSE_TRACKS.filter((t) => t.id !== "OTHER")
    .map((track) => {
      const inTrack = courses.filter((c) => c.track === track.id);
      return {
        track,
        published: inTrack.length,
        upcoming: upcoming.filter((c) => c.track === track.id).length,
        cover: inTrack.find((c) => c.thumbnailUrl)?.thumbnailUrl ?? null,
      };
    })
    .filter((t) => t.published + t.upcoming > 0);

  return (
    <div className="flex flex-col">
      <OrganizationJsonLd />
      <WebSiteJsonLd />

      {/* ════════════════════════ HERO ════════════════════════ */}
      <section aria-label="Hero" className="bg-[#0b1120] text-white">
        <div className="container mx-auto grid items-center gap-10 px-4 pb-16 pt-14 lg:grid-cols-[1fr_1.05fr] lg:gap-14 lg:pb-24 lg:pt-24">
          <div>
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
              Copy. Paste.{" "}
              <span className="text-emerald-400">Learn.</span>
            </h1>
            <p className="mt-5 max-w-xl text-xl font-medium text-slate-100">
              AI agents and local AI, one command at a time.
            </p>
            <p className="mt-3 max-w-xl text-lg leading-relaxed text-slate-300">
              Short video lessons where every command is on screen. You run
              it, you see what it does, you understand why.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="gap-2 bg-white px-8 text-base text-slate-950 hover:bg-slate-200"
                asChild
              >
                <Link href="/courses">
                  Start a free lesson
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/25 bg-transparent px-8 text-base text-white hover:bg-white/10 hover:text-white"
                asChild
              >
                <Link href="/pricing">See plans</Link>
              </Button>
            </div>
            <p className="mt-5 text-sm text-slate-400">
              The first lesson of every course is free. No signup, no card.
            </p>
          </div>

          <HeroTerminal demos={heroDemos} />
        </div>
      </section>

      {/* ═══════════════ TRACKS ═══════════════════════════════ */}
      {trackTiles.length > 0 && (
        <section aria-label="Tracks" className="border-b bg-muted/30 py-12 lg:py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Pick where you start
            </h2>
            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              {trackTiles.map(({ track, published, upcoming: soon, cover }) => (
                <Link
                  key={track.id}
                  href={`/courses#${track.anchor}`}
                  className="group flex flex-col overflow-hidden rounded-xl border bg-background transition-colors hover:border-foreground/40"
                >
                  {cover && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={cover}
                      alt=""
                      loading="lazy"
                      className="aspect-video w-full object-cover"
                    />
                  )}
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="text-2xl font-bold tracking-tight">
                      {track.title}
                    </h3>
                    <p className="mt-2 flex-1 text-muted-foreground">
                      {track.description}
                    </p>
                    <p className="mt-5 flex items-center justify-between text-sm font-medium">
                      <span>
                        {published > 0 &&
                          `${published} ${published === 1 ? "course" : "courses"}`}
                        {published > 0 && soon > 0 && ", "}
                        {soon > 0 && `${soon} coming soon`}
                      </span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════ INSTRUCTOR ═══════════════════════════ */}
      <section aria-label="Instructor" className="border-b py-12 lg:py-16">
        <div className="container mx-auto grid gap-6 px-4 lg:grid-cols-[1fr_2fr] lg:gap-14">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Taught by someone who runs this for a living
          </h2>
          <div className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
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

      {/* ═══════════════ FEATURED COURSES ═════════════════════ */}
      <section aria-label="Featured courses" className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Courses by Track
              </h2>
              <p className="mt-3 max-w-lg text-muted-foreground">
                Three tracks, and every course stands alone. The first lesson
                of each course is free, with no signup.
              </p>
            </div>
            <Button
              variant="outline"
              className="hidden gap-2 sm:inline-flex"
              asChild
            >
              <Link href="/courses">
                View All
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {courses.length > 0 || upcoming.length > 0 ? (
            <TrackCatalog courses={courses} upcoming={upcoming} />
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20">
              <BookOpen className="mb-4 h-10 w-10 text-muted-foreground/50" />
              <p className="text-lg font-medium text-muted-foreground">
                Courses coming soon!
              </p>
            </div>
          )}

          <div className="mt-8 text-center sm:hidden">
            <Button variant="outline" className="gap-2" asChild>
              <Link href="/courses">
                View All Courses
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════ WHY US / FEATURES ════════════════════ */}
      <section aria-label="Features" className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <Badge
              variant="outline"
              className="mb-3 text-xs uppercase tracking-wider"
            >
              Why CopyPasteLearn
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Built for IT Professionals
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              We combine expert instruction, real sandboxed environments, and a
              learn-by-doing philosophy that gets you job-ready faster.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: BookOpen,
                title: "Expert Video Lessons",
                description:
                  "Structured courses with video, transcripts, and code snippets. Resume exactly where you left off.",
              },
              {
                icon: Terminal,
                title: "Interactive Browser Labs",
                description:
                  "Spin up real Linux sandboxes in your browser. Follow guided steps with instant validation.",
              },
              {
                icon: Award,
                title: "Progress Tracking",
                description:
                  "Your dashboard tracks completed lessons, lab exercises, and course progress — gamified milestones included.",
              },
              {
                icon: Clock,
                title: "Bite-Sized Lessons",
                description:
                  "Every lesson is 5–15 minutes. Learn during lunch, on the commute, or whenever you have a spare moment.",
              },
              {
                icon: Zap,
                title: "Zero Setup Required",
                description:
                  "No VMs, no installations, no config files. Just open the lab and start typing commands.",
              },
              {
                icon: Users,
                title: "Community & Support",
                description:
                  "Join our Discord, ask questions, and collaborate with other learners on real-world challenges.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border bg-card p-6 transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/15">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-1.5 font-semibold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ LAB SPECS ════════════════════════════ */}
      <section
        aria-label="Lab specifications"
        className="border-y bg-muted/20 py-16 lg:py-24"
      >
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <Badge
              variant="outline"
              className="mb-3 text-xs uppercase tracking-wider"
            >
              Lab Environment
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              What&apos;s Included in Labs
            </h2>
            <p className="mt-3 text-muted-foreground">
              Real infrastructure, not simulations. Every lab runs in an
              isolated sandbox environment.
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Cpu,
                label: "Dedicated CPU",
                detail: "Full Linux environment",
              },
              {
                icon: HardDrive,
                label: "Persistent Storage",
                detail: "Save work across sessions",
              },
              {
                icon: Terminal,
                label: "Browser Terminal",
                detail: "Full bash shell access",
              },
              {
                icon: Wifi,
                label: "Network Access",
                detail: "Install packages, pull images",
              },
            ].map((spec) => (
              <div
                key={spec.label}
                className="flex items-center gap-3 rounded-xl border bg-card p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <spec.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{spec.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {spec.detail}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ HOW IT WORKS ═════════════════════════ */}
      <section aria-label="How it works" className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <Badge
              variant="outline"
              className="mb-3 text-xs uppercase tracking-wider"
            >
              Simple Process
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Three steps to go from zero to automation hero.
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Watch",
                description:
                  "Stream bite-sized video lessons with code snippets you can copy directly.",
                icon: Play,
              },
              {
                step: "2",
                title: "Practice",
                description:
                  "Launch a real sandbox lab in your browser and follow the guided steps.",
                icon: Terminal,
              },
              {
                step: "3",
                title: "Master",
                description:
                  "Complete validation checks, earn progress, and build real-world skills.",
                icon: Award,
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative rounded-xl border bg-card p-8 text-center"
              >
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                  {item.step}
                </div>
                <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ TESTIMONIALS ═════════════════════════ */}
      <section
        aria-label="Testimonials"
        className="border-t bg-muted/20 py-16 lg:py-24"
      >
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <Badge
              variant="outline"
              className="mb-3 text-xs uppercase tracking-wider"
            >
              Learner Stories
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              What Our Learners Say
            </h2>
          </div>

          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="flex flex-col rounded-xl border bg-card p-6"
              >
                <Quote className="mb-3 h-6 w-6 text-primary/30" />
                <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                  &ldquo;{t.text}&rdquo;
                </p>
                {/* Concrete outcome badge */}
                <div className="mt-4 rounded-lg bg-green-500/10 px-3 py-2">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-green-700 dark:text-green-400">
                    <CheckCircle2 className="h-3 w-3" />
                    {t.outcome}
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-1">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <div className="mt-3 border-t pt-3">
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {t.role} — {t.company}
                  </div>
                </div>
              </div>
            ))}
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

      {/* ═══════════════ BOTTOM CTA ══════════════════════════ */}
      <section
        aria-label="Call to action"
        className="relative overflow-hidden border-t bg-gradient-to-br from-primary/5 via-background to-primary/5 py-20 lg:py-28"
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.15)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.15)_1px,transparent_1px)] bg-[size:4rem_4rem]" />

        <div className="container relative mx-auto px-4 text-center">
          <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            Start Building Real Skills Today
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-lg text-muted-foreground">
            The first lesson of every course is free. Explore, practice, and
            decide at your own pace. No credit card needed.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="gap-2 px-10 text-base" asChild>
              <Link href="/courses">
                Start a Free Lesson
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 px-10 text-base"
              asChild
            >
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Free first lesson
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Real sandbox environments
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
