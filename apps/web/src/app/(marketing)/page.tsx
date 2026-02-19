import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Terminal, Award } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section aria-label="Hero" className="container mx-auto flex flex-col items-center px-4 py-24 text-center">
        <Badge variant="secondary" className="mb-4">
          Learn IT Automation by Doing
        </Badge>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Master IT Automation with{" "}
          <span className="text-primary">Hands-On Labs</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Watch expert video lessons, then practice in real environments. No
          setup needed — just copy, paste, and learn.
        </p>
        <div className="mt-8 flex gap-4">
          <Button size="lg" asChild>
            <Link href="/courses">Browse Courses</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/pricing">View Pricing</Link>
          </Button>
        </div>
      </section>

      {/* Value propositions */}
      <section aria-label="Features" className="border-t bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-2xl font-bold">
            Why CopyPasteLearn?
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">
                Expert Video Lessons
              </h3>
              <p className="text-sm text-muted-foreground">
                Structured courses with video lessons, transcripts, and code
                snippets. Resume exactly where you left off.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Terminal className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">
                Interactive Labs
              </h3>
              <p className="text-sm text-muted-foreground">
                Practice in real ephemeral environments right in your browser.
                Guided steps with instant validation feedback.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">
                Track Your Progress
              </h3>
              <p className="text-sm text-muted-foreground">
                See how far you&apos;ve come. Your dashboard tracks completed
                lessons, lab exercises, and course progress.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section aria-label="Call to action" className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold">Ready to start learning?</h2>
        <p className="mt-4 text-muted-foreground">
          The first lesson of every course is free. No credit card required.
        </p>
        <Button size="lg" className="mt-8" asChild>
          <Link href="/courses">Explore Courses</Link>
        </Button>
      </section>
    </div>
  );
}
