import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Terminal,
  Award,
  ArrowRight,
  Play,
  CheckCircle2,
} from "lucide-react";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

function OrganizationJsonLd() {
  const siteUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://copypastelearn.com";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "CopyPasteLearn",
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description:
      "Master IT automation with video courses and hands-on interactive labs.",
    sameAs: ["https://discord.gg/copypastelearn"],
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
    process.env.NEXT_PUBLIC_APP_URL ?? "https://copypastelearn.com";
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

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <OrganizationJsonLd />
      <WebSiteJsonLd />
      {/* Hero */}
      <section
        aria-label="Hero"
        className="relative overflow-hidden border-b bg-gradient-to-b from-background via-background to-muted/40"
      >
        {/* Decorative grid */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        <div className="container relative mx-auto flex flex-col items-center px-4 pb-20 pt-24 text-center lg:pb-28 lg:pt-32">
          <Badge
            variant="secondary"
            className="mb-6 gap-1.5 px-3 py-1 text-sm"
          >
            <Play className="h-3 w-3" />
            Learn IT Automation by Doing
          </Badge>

          <h1 className="max-w-4xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Master IT Automation with{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Hands-On Labs
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Watch expert video lessons, then practice in real environments. No
            setup needed — just copy, paste, and learn.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Button size="lg" className="gap-2 px-6" asChild>
              <Link href="/courses">
                Browse Courses
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="px-6" asChild>
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>

          {/* Social proof */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Free first lesson
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              No credit card required
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Real sandbox environments
            </div>
          </div>
        </div>
      </section>

      {/* Value propositions */}
      <section aria-label="Features" className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Why CopyPasteLearn?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              A learning experience designed for IT professionals who want
              practical skills, not just theory.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: BookOpen,
                title: "Expert Video Lessons",
                description:
                  "Structured courses with video lessons, transcripts, and code snippets. Resume exactly where you left off.",
              },
              {
                icon: Terminal,
                title: "Interactive Labs",
                description:
                  "Practice in real ephemeral environments right in your browser. Guided steps with instant validation feedback.",
              },
              {
                icon: Award,
                title: "Track Your Progress",
                description:
                  "See how far you've come. Your dashboard tracks completed lessons, lab exercises, and course progress.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border bg-card p-8 transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/15">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        aria-label="How it works"
        className="border-t border-b bg-muted/30 py-20 lg:py-28"
      >
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Three simple steps to go from zero to automation hero.
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Watch",
                description:
                  "Stream bite-sized video lessons with code snippets you can copy directly.",
              },
              {
                step: "02",
                title: "Practice",
                description:
                  "Launch a real sandbox lab in your browser and follow guided steps.",
              },
              {
                step: "03",
                title: "Master",
                description:
                  "Complete validation checks, track your progress, and build real skills.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
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

      {/* CTA */}
      <section
        aria-label="Call to action"
        className="py-20 lg:py-28"
      >
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to start learning?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-muted-foreground">
            The first lesson of every course is free. No credit card required.
          </p>
          <Button size="lg" className="mt-8 gap-2 px-8" asChild>
            <Link href="/courses">
              Explore Courses
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
