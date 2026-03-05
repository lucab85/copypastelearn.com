import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CourseCard } from "@/components/course/course-card";
import { getPublicCourses } from "@/server/queries/public-courses";
import {
  BookOpen,
  Terminal,
  Award,
  ArrowRight,
  Play,
  CheckCircle2,
  Users,
  GraduationCap,
  Layers,
  Monitor,
  Shield,
  Zap,
  Clock,
  Globe,
  Star,
  Quote,
  Target,
  Cpu,
  HardDrive,
  Wifi,
} from "lucide-react";

export const revalidate = 3600;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: "https://www.copypastelearn.com/", type: "website" },
};

/* ─── Structured Data ──────────────────────────────── */

function OrganizationJsonLd() {
  const siteUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://www.copypastelearn.com";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "CopyPasteLearn",
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description:
      "Master IT automation with video courses and hands-on interactive labs.",
    sameAs: [
      "https://github.com/copypastelearn",
      "https://twitter.com/copypastelearn",
      "https://discord.gg/copypastelearn",
    ],
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

const topics = [
  { label: "Docker & Containers", icon: Layers, href: "/courses" },
  { label: "Ansible & Automation", icon: Terminal, href: "/courses" },
  { label: "Node.js & APIs", icon: Globe, href: "/courses" },
  { label: "AI Agents", icon: Zap, href: "/courses" },
  { label: "DevOps & CI/CD", icon: Monitor, href: "/courses" },
  { label: "Security", icon: Shield, href: "/courses" },
];

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
  const courses = await getPublicCourses();

  return (
    <div className="flex flex-col">
      <OrganizationJsonLd />
      <WebSiteJsonLd />

      {/* ════════════════════════ HERO ════════════════════════ */}
      <section
        aria-label="Hero"
        className="relative overflow-hidden border-b bg-gradient-to-br from-background via-background to-primary/5"
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="pointer-events-none absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-40 h-[400px] w-[400px] rounded-full bg-primary/5 blur-3xl" />

        <div className="container relative mx-auto grid items-center gap-12 px-4 pb-20 pt-20 lg:grid-cols-2 lg:gap-16 lg:pb-28 lg:pt-28">
          {/* Left column — copy */}
          <div className="flex flex-col items-start">
            <Badge
              variant="secondary"
              className="mb-6 gap-1.5 px-3 py-1 text-sm"
            >
              <Play className="h-3 w-3" />
              New: OpenClaw AI Agent Course
            </Badge>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Learn IT Skills with{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Real Hands-On Labs
              </span>
            </h1>

            {/* ── IMPROVEMENT 1: Target personas + outcome ── */}
            <p className="mt-4 text-lg font-medium text-foreground/80">
              Built for DevOps engineers, SREs, and backend developers moving into cloud &amp; infrastructure.
            </p>
            <p className="mt-2 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Practice in real Linux sandboxes — no setup, no VMs. Ship your first automation in 60 minutes.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Button size="lg" className="gap-2 px-8 text-base" asChild>
                <Link href="/courses">
                  Explore Courses
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2 px-8 text-base"
                asChild
              >
                <Link href="/pricing">See Plans</Link>
              </Button>
            </div>

            {/* Trust badges */}
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                First lesson free
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                No credit card
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Cancel anytime
              </span>
            </div>
          </div>

          {/* Right column — terminal preview */}
          <div className="relative mx-auto w-full max-w-lg lg:mx-0">
            <div className="overflow-hidden rounded-xl border bg-card shadow-2xl shadow-primary/5">
              <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
                <span className="ml-2 text-xs text-muted-foreground">
                  lab — sandbox terminal
                </span>
              </div>
              <div className="space-y-3 p-5 font-mono text-sm leading-relaxed">
                <div>
                  <span className="text-green-500">$</span>{" "}
                  <span className="text-foreground">
                    docker run -d -p 80:80 nginx
                  </span>
                </div>
                <div className="text-muted-foreground">
                  Unable to find image &apos;nginx:latest&apos; locally
                </div>
                <div className="text-muted-foreground">
                  latest: Pulling from library/nginx
                </div>
                <div className="text-muted-foreground">
                  Status: Downloaded newer image for nginx:latest
                </div>
                <div className="text-green-500">
                  ✓ Container started on port 80
                </div>
                <div className="mt-2">
                  <span className="text-green-500">$</span>{" "}
                  <span className="text-foreground">curl localhost</span>
                </div>
                <div className="text-muted-foreground">
                  &lt;h1&gt;Welcome to nginx!&lt;/h1&gt;
                </div>
                <div className="inline-block h-4 w-2 animate-pulse bg-foreground" />
              </div>
            </div>
            <div className="absolute -bottom-4 -left-4 rounded-lg border bg-card px-4 py-2.5 shadow-lg">
              <div className="flex items-center gap-2 text-sm font-medium">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </div>
                Lab validated!
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ WHO IT'S FOR ═════════════════════════ */}
      <section aria-label="Who it's for" className="border-b bg-muted/20 py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: Monitor,
                persona: "DevOps / SREs",
                goal: "Automate infrastructure with Ansible, Docker, and Terraform",
                outcome: "Ship automation scripts in your first session",
              },
              {
                icon: Globe,
                persona: "Backend Engineers",
                goal: "Move into cloud & infrastructure with hands-on practice",
                outcome: "Deploy containerized services to production",
              },
              {
                icon: Zap,
                persona: "Tech Leads & Architects",
                goal: "Evaluate tools like MLflow, OpenClaw, and IaC frameworks",
                outcome: "Make informed decisions with real-world experience",
              },
            ].map((item) => (
              <div
                key={item.persona}
                className="flex items-start gap-4 rounded-xl border bg-card p-5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{item.persona}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.goal}
                  </p>
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
                    <Target className="h-3 w-3" />
                    {item.outcome}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════ STATS BAR ═══════════════════════ */}
      <section aria-label="Platform stats" className="border-b bg-muted/30">
        <div className="container mx-auto grid grid-cols-2 gap-6 px-4 py-10 sm:grid-cols-4">
          {[
            {
              value: `${courses.length}+`,
              label: "Courses",
              icon: BookOpen,
            },
            {
              value: `${courses.reduce((sum, c) => sum + c.lessonCount, 0)}+`,
              label: "Video Lessons",
              icon: Play,
            },
            { value: "Hands-on", label: "Browser Labs", icon: Terminal },
            {
              value: "100%",
              label: "Practical Skills",
              icon: GraduationCap,
            },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════ FEATURED COURSES ═════════════════════ */}
      <section aria-label="Featured courses" className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <Badge
                variant="outline"
                className="mb-3 text-xs uppercase tracking-wider"
              >
                Popular
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Featured Courses
              </h2>
              <p className="mt-3 max-w-lg text-muted-foreground">
                Hands-on courses designed by practitioners. Start with the free
                lesson — no signup required.
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

          {courses.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
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

      {/* ═══════════════ BROWSE TOPICS ════════════════════════ */}
      <section
        aria-label="Browse topics"
        className="border-y bg-muted/20 py-16 lg:py-24"
      >
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Explore Topics
            </h2>
            <p className="mt-3 text-muted-foreground">
              From containers to AI agents — find the skills that match your
              career goals.
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {topics.map((topic) => (
              <Link
                key={topic.label}
                href={topic.href}
                className="group flex flex-col items-center gap-3 rounded-xl border bg-card p-5 text-center transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/15">
                  <topic.icon className="h-6 w-6 text-primary" />
                </div>
                <span className="text-sm font-medium leading-tight">
                  {topic.label}
                </span>
              </Link>
            ))}
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
                  <p className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
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
                Browse Courses
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
