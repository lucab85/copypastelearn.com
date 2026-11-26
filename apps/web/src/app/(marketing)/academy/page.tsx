export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Clock,
  Copy,
  Eye,
  Gift,
  KeyRound,
  Layers,
  Mic,
  PlayCircle,
  ShieldCheck,
  Terminal,
  Workflow,
} from "lucide-react";
import { getPublicCourse, getPublicCourses } from "@/server/queries/public-courses";
import { getProPlan } from "@/server/queries/pro-plan";
import { PageEventTracker } from "@/components/analytics/page-event-tracker";
import { TrackedLink } from "@/components/analytics/tracked-link";
import { VideoPlayer } from "@/components/lesson/video-player";
import { OfferCountdown } from "@/components/academy/offer-countdown";
import { StickyCta } from "@/components/academy/sticky-cta";
import { ACADEMY_COURSES } from "@/lib/academy";
import { LAUNCH_OFFER, launchOfferActive } from "@/lib/launch-offer";
import { proPitch } from "@/lib/pro-pitch";

const TITLE = "Agentic AI Academy: Courses for AI Agents";
const DESCRIPTION =
  "Hands-on courses on running AI agents: kagent on Kubernetes, building and securing MCP servers, coding agents with goose, durable workflows with Dapr, and OpenTelemetry for agents.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/academy" },
  openGraph: { url: "/academy", type: "website", title: TITLE, description: DESCRIPTION },
  twitter: {
    card: "summary_large_image",
    site: "@copypastelearn",
    creator: "@TheLucaBerton",
    title: TITLE,
    description: DESCRIPTION,
  },
};

/** What goes wrong with agents in production, and the course that fixes it. */
const PROBLEMS = [
  {
    icon: KeyRound,
    problem: "It calls a tool it should not",
    fix: "Give agents MCP tools with authentication, then contain them with egress policies so they reach only what you allow.",
    slugs: ["kagent-ai-agents-on-kubernetes", "build-and-secure-an-mcp-server"],
  },
  {
    icon: Workflow,
    problem: "It crashes and forgets what it was doing",
    fix: "Run agents as durable workflows that pick up where they stopped after a restart.",
    slugs: ["build-durable-ai-agents-with-dapr-agents"],
  },
  {
    icon: Eye,
    problem: "Nobody can say why a run was slow, costly or wrong",
    fix: "Trace every model call and tool call, and read the answer in Jaeger.",
    slugs: ["observe-and-debug-ai-agents-with-opentelemetry"],
  },
  {
    icon: Terminal,
    problem: "The coding agent ignores the team's rules",
    fix: "Write the rules once in AGENTS.md and run the agent in CI with guardrails and a record of what it did.",
    slugs: ["coding-agents-in-production-goose-agents-md"],
  },
];

function hoursOf(seconds: number): string {
  const h = seconds / 3600;
  if (h < 1) return `${Math.round(seconds / 60)} minutes`;
  const rounded = Math.round(h * 2) / 2;
  return `${rounded % 1 === 0 ? rounded : rounded.toFixed(1)} hours`;
}

function minutesOf(seconds: number): string {
  return `${Math.max(1, Math.round(seconds / 60))} min`;
}

const primaryCta =
  "inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const secondaryCta =
  "inline-flex h-12 items-center justify-center gap-2 rounded-lg border px-6 text-base font-semibold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export default async function AcademyPage() {
  const [courses, plan, details] = await Promise.all([
    getPublicCourses(),
    getProPlan(),
    Promise.all(ACADEMY_COURSES.map((c) => getPublicCourse(c.slug))),
  ]);
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.copypastelearn.com";
  const now = Date.now();
  const offerActive = launchOfferActive(now);
  const pitch = plan ? proPitch(plan, offerActive) : null;

  // The Academy as it is in the database: only published courses and lessons.
  const academy = ACADEMY_COURSES.map((c, i) => {
    const detail = details[i];
    if (!detail) return { ...c, detail: null, seconds: 0, free: null };
    const seconds = detail.lessons.reduce((sum, l) => sum + (l.durationSeconds ?? 0), 0);
    const free = detail.lessons.find((l) => l.isFree) ?? null;
    return { ...c, detail, seconds, free };
  });
  const live = academy.filter((c) => c.detail);
  const lessonCount = live.reduce((sum, c) => sum + (c.detail?.lessons.length ?? 0), 0);
  const totalSeconds = live.reduce((sum, c) => sum + c.seconds, 0);
  const first = live[0] ?? null;
  const freeHref = first?.free ? `/courses/${first.slug}/lessons/${first.free.slug}` : null;
  const trailer = live.find((c) => c.detail?.trailerPlaybackId) ?? null;
  const titleOf = (slug: string) => ACADEMY_COURSES.find((c) => c.slug === slug)?.title ?? slug;
  const isLive = (slug: string) => live.some((c) => c.slug === slug);

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Agentic AI Academy",
    description: DESCRIPTION,
    url: `${siteUrl}/academy`,
    numberOfItems: live.length,
    itemListElement: live.map((c, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${siteUrl}/courses/${c.slug}`,
      name: c.title,
      description: c.summary,
    })),
  };

  const offer =
    offerActive && pitch?.offer ? (
      <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <Gift className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <span>{pitch.offer}</span>
        <OfferCountdown end={LAUNCH_OFFER.end} serverNow={now} />
      </p>
    ) : null;

  return (
    <div className="pb-20 md:pb-0">
      <PageEventTracker event="view_academy" params={{ published_courses: live.length }} />
      {live.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}

      {/* Hero: the promise, the facts, two calls to action, the trailer */}
      <section className="border-b">
        <div className="container mx-auto grid items-center gap-10 px-4 py-12 lg:grid-cols-2 lg:py-20">
          <div className="min-w-0">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Your AI agent works in the demo. Make it work in production.
            </h1>
            <p className="mt-5 max-w-prose text-lg leading-relaxed text-muted-foreground">
              The Agentic AI Academy is {live.length} hands-on courses on the open-source tools that run
              agents for real: kagent on Kubernetes, secure MCP servers, coding agents with goose, durable
              workflows with Dapr and OpenTelemetry tracing. Watch every command run, then copy it into your
              own terminal.
            </p>

            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <li className="flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-primary" aria-hidden="true" />
                <strong>{live.length}</strong> courses
              </li>
              <li className="flex items-center gap-1.5">
                <PlayCircle className="h-4 w-4 text-primary" aria-hidden="true" />
                <strong>{lessonCount}</strong> video lessons
              </li>
              {totalSeconds > 0 && (
                <li className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
                  <strong>{hoursOf(totalSeconds)}</strong> of video
                </li>
              )}
              <li className="flex items-center gap-1.5">
                <Gift className="h-4 w-4 text-primary" aria-hidden="true" />
                First lesson of each course free
              </li>
            </ul>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <TrackedLink href="/pricing" ctaText="Unlock the Academy" ctaLocation="academy_hero" className={primaryCta}>
                Unlock the whole Academy <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </TrackedLink>
              {freeHref && (
                <TrackedLink
                  href={freeHref}
                  ctaText="Watch lesson 1 free"
                  ctaLocation="academy_hero"
                  className={secondaryCta}
                >
                  <PlayCircle className="h-4 w-4" aria-hidden="true" /> Watch lesson 1 free
                </TrackedLink>
              )}
            </div>
            {pitch && <p className="mt-3 text-sm text-muted-foreground">Pro: {pitch.price}. Cancel anytime.</p>}
            {offer}
          </div>

          {trailer?.detail?.trailerPlaybackId && (
            <figure className="min-w-0">
              <div className="overflow-hidden rounded-xl border shadow-sm">
                <VideoPlayer
                  playbackId={trailer.detail.trailerPlaybackId}
                  title={`${trailer.title}: trailer`}
                  courseSlug={trailer.slug}
                  lessonSlug="trailer"
                />
              </div>
              <figcaption className="mt-2 text-sm text-muted-foreground">
                Trailer of course 1, {trailer.title}.
              </figcaption>
            </figure>
          )}
        </div>
      </section>

      {/* Four ways agents fail, each with the course that fixes it */}
      <section aria-labelledby="problems" className="border-b bg-muted/30 py-14 lg:py-20">
        <div className="container mx-auto px-4">
          <h2 id="problems" className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
            Agent demos are easy. These are the four ways they fail in production.
          </h2>
          <p className="mt-4 max-w-prose text-lg text-muted-foreground">
            Each one has a course that fixes it, with the commands and files you need.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {PROBLEMS.map(({ icon: Icon, problem, fix, slugs }) => (
              <div key={problem} className="rounded-xl border bg-background p-6">
                <h3 className="flex items-start gap-3 text-xl font-semibold">
                  <Icon className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  {problem}
                </h3>
                <p className="mt-3 max-w-prose text-muted-foreground">{fix}</p>
                <ul className="mt-4 space-y-1 text-sm">
                  {slugs.filter(isLive).map((slug) => (
                    <li key={slug}>
                      <Link
                        href={`/courses/${slug}`}
                        className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {titleOf(slug)} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The courses, in order */}
      <section aria-labelledby="curriculum" className="border-b py-14 lg:py-20">
        <div className="container mx-auto px-4">
          <h2 id="curriculum" className="text-3xl font-bold tracking-tight sm:text-4xl">
            {live.length} courses, in the order to take them
          </h2>
          <p className="mt-4 max-w-prose text-lg text-muted-foreground">
            Start with the agent platform, then secure its tools, put coding agents to work, make agents
            durable, and finish with the traces that tell you what they did.
          </p>
          <ol className="mt-10 space-y-5">
            {academy.map((c, index) => (
              <li
                key={c.slug}
                className="grid gap-4 rounded-xl border p-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:p-6"
              >
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <h3 className="text-xl font-semibold">
                    <span className="sr-only">Course {index + 1}: </span>
                    {c.detail ? (
                      <Link href={`/courses/${c.slug}`} className="underline-offset-4 hover:underline">
                        {c.title}
                      </Link>
                    ) : (
                      c.title
                    )}
                  </h3>
                  <p className="mt-2 max-w-prose text-muted-foreground">{c.summary}</p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {c.topics.map((t) => (
                      <li key={t} className="rounded-full border px-3 py-1 text-sm">
                        {t}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                    {c.detail ? (
                      <>
                        <span className="text-muted-foreground">
                          {c.detail.lessons.length} lessons
                          {c.seconds > 0 && `, ${minutesOf(c.seconds)}`}
                          {c.detail.hasAssessment && ", final assessment"}
                        </span>
                        {c.free && (
                          <TrackedLink
                            href={`/courses/${c.slug}/lessons/${c.free.slug}`}
                            ctaText="Watch lesson 1 free"
                            ctaLocation="academy_curriculum"
                            className="inline-flex items-center gap-1 font-semibold text-primary underline-offset-4 hover:underline"
                          >
                            <PlayCircle className="h-4 w-4" aria-hidden="true" /> Watch lesson 1 free
                          </TrackedLink>
                        )}
                      </>
                    ) : (
                      <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium">In production</span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* How a lesson works */}
      <section aria-labelledby="how" className="border-b bg-muted/30 py-14 lg:py-20">
        <div className="container mx-auto px-4">
          <h2 id="how" className="text-3xl font-bold tracking-tight sm:text-4xl">
            No slides. A real terminal, start to finish.
          </h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              {
                icon: PlayCircle,
                title: "Watch it run",
                text: "Every lesson is a screen recording of the commands being typed and the real output coming back.",
              },
              {
                icon: Copy,
                title: "Copy it",
                text: "The files and commands of each lesson sit under the video, ready to paste into your own terminal.",
              },
              {
                icon: ShieldCheck,
                title: "Trust the versions",
                text: "Everything was run against the exact versions named in each course, so what you copy behaves the way you saw it.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title}>
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                  <Icon className="h-5 w-5 text-primary" aria-hidden="true" /> {title}
                </h3>
                <p className="mt-2 max-w-prose text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Instructor */}
      <section aria-labelledby="instructor" className="border-b py-14 lg:py-20">
        <div className="container mx-auto grid items-center gap-8 px-4 sm:grid-cols-[auto_minmax(0,1fr)] lg:gap-14">
          <Image
            src="/images/luca-berton.jpg"
            alt="Luca Berton"
            width={480}
            height={672}
            sizes="(min-width: 640px) 224px, 144px"
            className="h-auto w-36 rounded-xl sm:w-56"
          />
          <div className="max-w-prose text-lg leading-relaxed text-muted-foreground">
            <h2 id="instructor" className="mb-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Taught by someone who runs this for a living
            </h2>
            <p>
              <span className="font-semibold text-foreground">Luca Berton</span> is the author of Ansible Pilot
              and Ansible By Example, a Docker Captain, and a speaker at Red Hat Summit 2026. Every lesson comes
              from a system he built and runs himself.
            </p>
            <p className="mt-4">
              <Link href="/about" className="font-medium text-foreground underline underline-offset-4">
                About Luca and CopyPasteLearn
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Price */}
      <section aria-labelledby="price" className="border-b py-14 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl rounded-2xl border-2 border-primary p-6 sm:p-10">
            <h2 id="price" className="text-3xl font-bold tracking-tight sm:text-4xl">
              One membership. The whole Academy, and every other course.
            </h2>
            {pitch && <p className="mt-4 text-2xl font-semibold">{pitch.price}</p>}
            <ul className="mt-6 space-y-3">
              {[
                `All ${live.length} Academy courses: ${lessonCount} video lessons${
                  totalSeconds > 0 ? `, ${hoursOf(totalSeconds)} of video` : ""
                }`,
                `Every other course on CopyPasteLearn, ${courses.length} in total`,
                "Every course added while you are a member",
                "The code of every lesson, ready to copy",
                "Final assessments where a course has one",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <TrackedLink
              href="/pricing"
              ctaText="Unlock the Academy"
              ctaLocation="academy_price"
              className={`${primaryCta} mt-8 w-full`}
            >
              Unlock the whole Academy <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </TrackedLink>
            {offer}
            <p className="mt-5 text-sm text-muted-foreground">
              Cancel anytime from your account settings. The first payment can be refunded within 14 days, under
              the conditions of the{" "}
              <Link href="/refund-policy" className="underline underline-offset-2">
                refund policy
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq" className="border-b py-14 lg:py-20">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 id="faq" className="text-3xl font-bold tracking-tight sm:text-4xl">
            Questions before you start
          </h2>
          <div className="mt-8 divide-y rounded-xl border">
            {[
              {
                q: "Can I try it before I pay?",
                a: "Yes. The first lesson of every course is free, with no account and no card.",
              },
              {
                q: "Who narrates the lessons?",
                a: "A synthetic voice made from the author's own voice. The commands, files and results you see are real: they were run against the exact versions named in each course.",
              },
              {
                q: "What do I need on my computer?",
                a: "Each course page lists what it needs before you start.",
              },
              {
                q: "Is the Academy part of kagent, MCP or goose?",
                a: "No. It is independent training, not affiliated with or endorsed by the kagent, Model Context Protocol or goose projects, or by their maintainers.",
              },
              {
                q: "Can I cancel?",
                a: "Anytime, from your account settings. The first payment can be refunded within 14 days under the refund policy.",
              },
              {
                q: "Do I get the courses that come later?",
                a: "Yes. A membership includes every current course and every course added while you are a member.",
              },
            ].map(({ q, a }) => (
              <details key={q} className="group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {q}
                  <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-open:rotate-90" aria-hidden="true" />
                </summary>
                <p className="mt-3 max-w-prose text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
          <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Mic className="h-4 w-4" aria-hidden="true" /> Narration: a synthetic voice made from the author&apos;s own
            voice.
          </p>
        </div>
      </section>

      {/* Final call to action */}
      <section aria-labelledby="final" className="bg-zinc-950 py-14 text-white lg:py-20">
        <div className="container mx-auto px-4">
          <h2 id="final" className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
            Ship the agent, not another demo.
          </h2>
          <p className="mt-4 max-w-prose text-lg text-zinc-300">
            Watch the first lesson now. If it is what you need, Pro unlocks the rest of the Academy and every
            other course.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <TrackedLink
              href="/pricing"
              ctaText="Unlock the Academy"
              ctaLocation="academy_final"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-6 text-base font-semibold text-zinc-950 transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            >
              Unlock the whole Academy <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </TrackedLink>
            {freeHref && (
              <TrackedLink
                href={freeHref}
                ctaText="Watch lesson 1 free"
                ctaLocation="academy_final"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-zinc-600 px-6 text-base font-semibold transition-colors hover:bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
              >
                <PlayCircle className="h-4 w-4" aria-hidden="true" /> Watch lesson 1 free
              </TrackedLink>
            )}
          </div>
          {offerActive && pitch?.offer && (
            <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-200">
              <Gift className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{pitch.offer}</span>
              <OfferCountdown end={LAUNCH_OFFER.end} serverNow={now} />
            </p>
          )}
        </div>
      </section>

      <StickyCta freeHref={freeHref} />
    </div>
  );
}
