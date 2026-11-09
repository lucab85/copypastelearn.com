export const revalidate = 3600;
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Mic, ShieldCheck, Gift } from "lucide-react";
import { getPublicCourses } from "@/server/queries/public-courses";
import { PageEventTracker } from "@/components/analytics/page-event-tracker";

const TITLE = "Agentic AI Academy: Courses for AI Agents";
const DESCRIPTION =
  "Hands-on courses on running AI agents: kagent on Kubernetes, building and securing MCP servers, and coding agents with goose and AGENTS.md.";

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

/**
 * The three courses of the Academy, in the order to take them. Only courses that are PUBLISHED in the database get a
 * link: the others show "In production", so the page never points to a 404.
 */
const ACADEMY = [
  {
    slug: "kagent-ai-agents-on-kubernetes",
    title: "kagent 1.0: Run AI Agents on Kubernetes",
    summary:
      "Install kagent, build a Kubernetes-native agent, give it MCP tools, contain it with egress policies and trace everything it does.",
    topics: ["Agent Substrate sandboxes", "MCP tools", "Egress policies", "OpenTelemetry tracing"],
  },
  {
    slug: "build-and-secure-an-mcp-server",
    title: "Build and Secure an MCP Server",
    summary:
      "Build a real MCP server in Python with the official SDK, serve it over HTTP, add authentication and hardening, then deploy it to a kagent cluster.",
    topics: ["Typed tools, resources, prompts", "Streamable HTTP", "Authentication", "Deploy to Kubernetes"],
  },
  {
    slug: "coding-agents-in-production-goose-agents-md",
    title: "Run Coding Agents in Production with goose and AGENTS.md",
    summary:
      "Install goose, teach it your project's rules with AGENTS.md, then run it the way a team does: recipes, CI, guardrails and a record of what it did.",
    topics: ["AGENTS.md", "Recipes", "GitHub Actions", "Guardrails with hooks"],
  },
];

export default async function AcademyPage() {
  const courses = await getPublicCourses();
  const published = new Map(courses.map((c) => [c.slug, c]));
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.copypastelearn.com";

  const live = ACADEMY.filter((c) => published.has(c.slug));
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

  return (
    <div>
      <PageEventTracker event="view_academy" params={{ published_courses: live.length }} />
      {live.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}

      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-12 lg:py-16">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Agentic AI Academy</h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            Learn the tools that run AI agents in production. Each course is a short series of
            lessons: you watch the commands run, then repeat them with the lab files.
          </p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
            <Gift className="h-4 w-4" aria-hidden="true" /> The first lesson of every course is free.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-6 lg:grid-cols-3">
          {ACADEMY.map((c, index) => {
            const course = published.get(c.slug);
            return (
              <div key={c.slug} className="flex flex-col rounded-xl border p-6">
                <span className="text-xs font-medium text-muted-foreground">Course {index + 1}</span>
                <h2 className="mt-1 text-xl font-semibold">{c.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{c.summary}</p>
                <ul className="mt-4 space-y-1 text-sm">
                  {c.topics.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
                <div className="mt-6 pt-2">
                  {course ? (
                    <Link
                      href={`/courses/${c.slug}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      Start with the free lesson ({course.lessonCount} lessons){" "}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  ) : (
                    <span className="inline-block rounded-full bg-muted px-3 py-1 text-xs font-medium">
                      In production
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border bg-muted/20 p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Mic className="h-5 w-5" aria-hidden="true" /> A synthetic voice
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Every lesson is narrated with a synthetic voice made from the author&apos;s own voice. The
              commands, files and results you see are real: they were run against the exact versions named
              in each course.
            </p>
          </div>
          <div className="rounded-xl border bg-muted/20 p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" /> Independent training
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This Academy is independent. It is not affiliated with or endorsed by the kagent, Model Context
              Protocol or goose projects, or by their maintainers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
