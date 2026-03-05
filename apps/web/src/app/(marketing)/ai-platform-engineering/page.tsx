import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MailtoButton } from "@/components/ui/mailto-button";
import { EmailLink } from "@/components/ui/email-link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Shield,
  Server,
  BarChart3,
  Layers,
  Target,
  Users,
  Clock,
  BookOpen,
  MessageSquare,
  Phone,
  ArrowRight,
  AlertTriangle,
  Zap,
} from "lucide-react";

export const metadata: Metadata = {
  title: "AI Platform Engineering for Enterprise Leaders — Live Cohort Program",
  description:
    "The 6-week live program that gives CTOs, CIOs, and engineering leaders a battle-tested blueprint for building AI platforms that actually work in regulated enterprises.",
  alternates: { canonical: "/ai-platform-engineering" },
  openGraph: {
    title: "AI Platform Engineering for Enterprise Leaders",
    description:
      "Stop burning budget on AI projects that never reach production. 6-week live program for technical leaders.",
    type: "website",
  },
};

function ProgramJsonLd() {
  const siteUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://www.copypastelearn.com";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: "AI Platform Engineering for Enterprise Leaders",
    description:
      "6-week live program for CTOs, CIOs, and engineering leaders building AI platforms in regulated enterprises.",
    url: `${siteUrl}/ai-platform-engineering`,
    provider: {
      "@type": "Organization",
      name: "CopyPasteLearn",
      url: siteUrl,
    },
    instructor: {
      "@type": "Person",
      name: "Luca Berton",
      jobTitle: "AI Infrastructure Architect",
      url: "https://www.lucaberton.com",
    },
    educationalLevel: "Executive",
    timeRequired: "PT36H",
    numberOfCredits: 12,
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "Online",
      courseSchedule: {
        "@type": "Schedule",
        repeatFrequency: "P1W",
        repeatCount: 6,
      },
    },
    offers: {
      "@type": "Offer",
      price: "2500",
      priceCurrency: "EUR",
      availability: "https://schema.org/LimitedAvailability",
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

const weeklyTopics = [
  {
    week: 1,
    title: "Why AI Projects Fail at Infrastructure",
    description:
      "The 87% failure rate, POC vs production, the AI Platform Maturity Model, and 3 real enterprise failure case studies.",
    icon: AlertTriangle,
  },
  {
    week: 2,
    title: "Compute & Orchestration Decisions",
    description:
      "GPU strategy, Kubernetes for AI, cloud economics, FinOps for AI workloads, and TCO calculation.",
    icon: Server,
  },
  {
    week: 3,
    title: "The ML Pipeline — Data to Deployment",
    description:
      "Data lakehouse architecture, feature stores, MLOps pipelines, CI/CD for ML, and vendor landscape.",
    icon: Layers,
  },
  {
    week: 4,
    title: "Security, Compliance & Governance",
    description:
      "AI threat models, EU AI Act implications, model auditing, data lineage, and governance frameworks.",
    icon: Shield,
  },
  {
    week: 5,
    title: "GenAI Infrastructure — The New Challenge",
    description:
      "LLM hosting decisions, RAG architecture, vector databases, fine-tuning infrastructure, and internal AI platforms.",
    icon: Zap,
  },
  {
    week: 6,
    title: "Roadmap & Transformation",
    description:
      "Build and present your AI Platform Roadmap. Peer review, 90-day action plan, and capstone deliverable.",
    icon: Target,
  },
];

const included = [
  { icon: BookOpen, text: "12 live sessions (90 min each, recorded)" },
  { icon: BarChart3, text: "AI Platform Assessment Tool" },
  { icon: Layers, text: "25+ Vendor Comparison Matrix" },
  { icon: BarChart3, text: "AI Infrastructure Cost Calculator" },
  { icon: Shield, text: "AI Governance Policy Template" },
  { icon: Target, text: "MLOps Pipeline Design Worksheet" },
  { icon: CheckCircle2, text: "90-Day Implementation Checklist" },
  { icon: MessageSquare, text: "Private Slack community (lifetime)" },
  { icon: Phone, text: "1:1 Strategy Call with Luca (30 min)" },
];

const forYou = [
  "CTO, CIO, VP of Engineering, or Head of AI at 500+ employee companies",
  "Organizations moving from AI experimentation to production",
  "Regulated industries — finance, healthcare, government, energy",
  "Leaders making infrastructure decisions in an overwhelming landscape",
  "Teams burned by AI vendors selling magic and delivering PowerPoints",
];

const notForYou = [
  "Looking for a coding bootcamp (this is strategic, not hands-on coding)",
  "Want a €15 Udemy course (this is a professional investment)",
  "Company has fewer than 100 employees (too early for platform engineering)",
  "Want vendor-specific training (we are vendor-neutral)",
];

const faqs = [
  {
    q: "When does the next cohort start?",
    a: "We run 4 cohorts per year. Join the waitlist to be notified when the next one opens.",
  },
  {
    q: "What if I miss a live session?",
    a: "All sessions are recorded and available within 24 hours. You can also ask questions asynchronously in the private Slack community.",
  },
  {
    q: "Is this technical?",
    a: "It's technical enough to make real decisions, but you won't write code. Think \"executive technical literacy\" — you'll understand what your teams are doing and why.",
  },
  {
    q: "Can I expense this?",
    a: "Yes. We provide invoices and certificates of completion. Most participants expense this through L&D or professional development budgets.",
  },
  {
    q: "What's the time commitment?",
    a: "3 hours per week for live sessions plus 1-2 hours for assignments. Assignments are practical — you're building your actual roadmap, not busywork.",
  },
  {
    q: "Do you offer refunds?",
    a: "Full refund within 14 days if the program isn't what you expected. No questions asked.",
  },
  {
    q: "I'm not a CIO/CTO. Can I still join?",
    a: "Absolutely — if you're involved in AI infrastructure decisions (Platform Lead, ML Engineering Manager, Solutions Architect), you'll get massive value.",
  },
];

export default function AIPlatformEngineeringPage() {
  return (
    <div>
      <ProgramJsonLd />

      {/* Hero */}
      <section className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-16 lg:py-24 text-center">
          <Badge variant="secondary" className="mb-4">
            Limited to 20 seats per cohort
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Stop Burning Budget on AI Projects
            <br />
            That Never Reach Production
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-xl text-muted-foreground">
            The 6-week live program that gives CTOs, CIOs, and engineering
            leaders a battle-tested blueprint for building AI platforms that
            actually work — in regulated enterprises.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="#pricing">
                Join the Next Cohort <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#curriculum">See the Curriculum</Link>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span>✅ 8 Published Technical Books</span>
            <span>✅ 1M+ YouTube Views</span>
            <span>✅ 793+ Tutorials</span>
            <span>✅ Enterprise AI Architect</span>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="container mx-auto px-4 py-16 lg:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight">
            The Uncomfortable Truth About Enterprise AI
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            You&apos;ve seen the demos. Your board is excited. Your teams have
            built promising prototypes. Then reality hits:
          </p>
          <div className="mt-8 space-y-4">
            {[
              "The model that worked in a notebook crashes under production load",
              "Your compliance team blocks deployment — nobody planned for data governance",
              "Cloud costs spiral to 10x the original estimate",
              "ML engineers and platform teams speak completely different languages",
              "Six months and €500K later, you're back to square one",
            ].map((pain) => (
              <div key={pain} className="flex gap-3">
                <span className="mt-0.5 text-destructive">✗</span>
                <p className="text-muted-foreground">{pain}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-lg border bg-muted/50 p-6">
            <p className="text-lg font-semibold">
              You don&apos;t have an AI problem. You have an infrastructure
              problem.
            </p>
            <p className="mt-2 text-muted-foreground">
              87% of AI projects never make it to production. Not because the
              models are bad — because the platform underneath them
              doesn&apos;t exist.
            </p>
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="border-y bg-muted/20">
        <div className="container mx-auto px-4 py-16 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              What If You Could See the Whole Picture?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              This isn&apos;t another &quot;AI will change everything&quot;
              keynote. This is the infrastructure playbook.
            </p>
          </div>
          <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Target,
                title: "AI Platform Roadmap",
                desc: "Tailored to your organization, ready for board approval.",
              },
              {
                icon: BarChart3,
                title: "Realistic Budget",
                desc: "No more surprise cloud bills. Know what AI infra actually costs.",
              },
              {
                icon: Shield,
                title: "Governance Framework",
                desc: "Satisfies regulators AND engineers. EU AI Act ready.",
              },
              {
                icon: Layers,
                title: "Vendor Strategy",
                desc: "Build vs buy decisions backed by data, not vendor pitches.",
              },
              {
                icon: Users,
                title: "Team Plan",
                desc: "Who to hire, when, and what to outsource.",
              },
              {
                icon: Clock,
                title: "90-Day Action Plan",
                desc: "Start Monday. Concrete next steps, not vague strategy.",
              },
            ].map((item) => (
              <Card key={item.title}>
                <CardHeader className="pb-3">
                  <item.icon className="h-8 w-8 text-primary" />
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Curriculum */}
      <section id="curriculum" className="container mx-auto px-4 py-16 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            6 Weeks. 12 Live Sessions. One Roadmap.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Every session is practical. No fluff. No filler. You build your AI
            Platform Roadmap as you go.
          </p>
        </div>
        <div className="mx-auto mt-12 max-w-3xl space-y-6">
          {weeklyTopics.map((week) => (
            <div
              key={week.week}
              className="flex gap-6 rounded-lg border p-6"
            >
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <week.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-primary">
                  Week {week.week}
                </p>
                <h3 className="mt-1 text-lg font-semibold">{week.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {week.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Who It's For */}
      <section className="border-y bg-muted/20">
        <div className="container mx-auto px-4 py-16 lg:py-20">
          <div className="mx-auto max-w-3xl">
            <div className="grid gap-12 md:grid-cols-2">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  This Program Is For You If:
                </h2>
                <div className="mt-6 space-y-3">
                  {forYou.map((item) => (
                    <div key={item} className="flex gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                      <p className="text-sm text-muted-foreground">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  This Is NOT For You If:
                </h2>
                <div className="mt-6 space-y-3">
                  {notForYou.map((item) => (
                    <div key={item} className="flex gap-3">
                      <span className="mt-0.5 text-destructive">✗</span>
                      <p className="text-sm text-muted-foreground">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Instructor */}
      <section className="container mx-auto px-4 py-16 lg:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight">
            Your Instructor
          </h2>
          <div className="mt-8 rounded-lg border p-8">
            <h3 className="text-xl font-semibold">Luca Berton</h3>
            <p className="mt-1 text-primary font-medium">
              AI Infrastructure Architect · Author · Educator
            </p>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Luca has spent his career building the production-grade platforms
              underneath enterprise AI — securely, at scale, with measurable
              ROI. He&apos;s worked with regulated enterprises across Europe,
              helping them move from AI prototypes to production systems that
              pass compliance audits and deliver business value.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                "📚 Author of 8 technical books",
                "🎥 1M+ YouTube views, 793+ tutorials",
                "🏢 Founder of Open Empower BV",
                "🎤 Conference speaker (KubeCon, DevOps)",
                "🔧 Kubernetes, Terraform, MLOps at scale",
                "🏛️ Regulated enterprise specialist",
              ].map((cred) => (
                <p key={cred} className="text-sm text-muted-foreground">
                  {cred}
                </p>
              ))}
            </div>
            <blockquote className="mt-6 border-l-2 border-primary pl-4 italic text-muted-foreground">
              &quot;I&apos;ve seen too many brilliant AI models die because
              nobody built the runway for them to land on. This program fixes
              that.&quot;
            </blockquote>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="border-y bg-muted/20">
        <div className="container mx-auto px-4 py-16 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Everything You Get
            </h2>
          </div>
          <div className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-2">
            {included.map((item) => (
              <div key={item.text} className="flex items-start gap-3 rounded-lg border bg-background p-4">
                <item.icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <p className="text-sm">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container mx-auto px-4 py-16 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Choose Your Path
          </h2>
          <p className="mt-4 text-muted-foreground">
            Most companies spend more on a single failed AI POC than this
            entire program.
          </p>
        </div>
        <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-3">
          {/* Individual */}
          <Card>
            <CardHeader>
              <CardTitle>Individual</CardTitle>
              <p className="text-3xl font-bold">
                €2,500
              </p>
              <p className="text-sm text-muted-foreground">per person</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                "12 live sessions + recordings",
                "All templates & tools",
                "Private Slack community",
                "30-min 1:1 strategy call",
                "Invoice / PO available",
              ].map((f) => (
                <div key={f} className="flex gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                  <span>{f}</span>
                </div>
              ))}
              <MailtoButton className="mt-4 w-full" user="luca" domain="lucaberton.it" subject="AI Platform Engineering - Individual">
                  Reserve Your Seat
              </MailtoButton>
            </CardContent>
          </Card>

          {/* Team */}
          <Card className="border-primary">
            <CardHeader>
              <Badge className="w-fit">Most Popular</Badge>
              <CardTitle>Team</CardTitle>
              <p className="text-3xl font-bold">
                €2,000
                <span className="text-base font-normal text-muted-foreground">
                  /seat
                </span>
              </p>
              <p className="text-sm text-muted-foreground">3–5 seats</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                "Everything in Individual",
                "30-min 1:1 per team member",
                "Team pricing discount",
                "Shared Slack channel",
                "Invoice / PO available",
              ].map((f) => (
                <div key={f} className="flex gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                  <span>{f}</span>
                </div>
              ))}
              <MailtoButton className="mt-4 w-full" user="luca" domain="lucaberton.it" subject="AI Platform Engineering - Team">
                  Contact for Team Pricing
              </MailtoButton>
            </CardContent>
          </Card>

          {/* Enterprise */}
          <Card>
            <CardHeader>
              <CardTitle>Enterprise</CardTitle>
              <p className="text-3xl font-bold">Custom</p>
              <p className="text-sm text-muted-foreground">6+ seats</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                "Everything in Team",
                "60-min 1:1 + team workshop",
                "Custom AI platform assessment",
                "Tailored case studies",
                "Dedicated account manager",
              ].map((f) => (
                <div key={f} className="flex gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                  <span>{f}</span>
                </div>
              ))}
              <MailtoButton className="mt-4 w-full" variant="outline" user="luca" domain="lucaberton.it" subject="AI Platform Engineering - Enterprise">
                  Contact Us
              </MailtoButton>
            </CardContent>
          </Card>
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted-foreground">
          💡 <strong>L&amp;D Budget Friendly:</strong> Most companies have
          €2–5K per person annual training budgets. This qualifies. We provide
          invoices and certificates of completion.
        </p>
      </section>

      {/* FAQ */}
      <section className="border-t bg-muted/20">
        <div className="container mx-auto px-4 py-16 lg:py-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight text-center">
              Frequently Asked Questions
            </h2>
            <div className="mt-12 space-y-8">
              {faqs.map((faq) => (
                <div key={faq.q}>
                  <h3 className="font-semibold">{faq.q}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t">
        <div className="container mx-auto px-4 py-16 lg:py-20 text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Your AI Projects Deserve a Real Platform
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Limited to 20 seats per cohort to keep it interactive and
            high-impact.
          </p>
          <div className="mt-8">
            <MailtoButton size="lg" user="luca" domain="lucaberton.it" subject="AI Platform Engineering - Reserve Seat">
                Reserve Your Seat — €2,500 <ArrowRight className="ml-2 h-4 w-4" />
            </MailtoButton>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Questions?{" "}
            <EmailLink
              user="luca"
              domain="lucaberton.it"
              className="underline hover:text-foreground"
            />
          </p>
        </div>
      </section>
    </div>
  );
}
