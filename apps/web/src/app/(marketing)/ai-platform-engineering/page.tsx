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
  Brain,
  Database,
  Lock,
  TrendingUp,
  Cpu,
  Globe,
} from "lucide-react";

export const metadata: Metadata = {
  title: "AI Platform Engineering — Live Program",
  description:
    "6-week live program for CTOs and engineering leaders. Build production-grade GenAI platforms — RAG, LLM orchestration, AI agents, and governance for regulated enterprises.",
  alternates: { canonical: "/ai-platform-engineering" },
  openGraph: {
    url: "/ai-platform-engineering",
    title: "AI Platform Engineering for Enterprise Leaders",
    description:
      "Stop burning budget on AI projects that never reach production. Master GenAI infrastructure in 6 weeks.",
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
      "6-week live program for CTOs, CIOs, and engineering leaders building GenAI platforms in regulated enterprises. Covers RAG, LLM orchestration, AI agents, vector databases, and EU AI Act governance.",
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
    title: "Why AI Projects Fail — And How GenAI Made It Worse",
    description:
      "The 87% failure rate, POC-to-production gap, the AI Platform Maturity Model. Why GenAI amplified infrastructure complexity by 10x. Three enterprise failure case studies — and what they'd do differently.",
    icon: AlertTriangle,
  },
  {
    week: 2,
    title: "GPU Strategy & LLM Hosting Decisions",
    description:
      "GPU procurement vs cloud (A100/H100/H200 economics), Kubernetes for AI workloads, inference optimization (vLLM, TensorRT-LLM), FinOps for GenAI, and real TCO calculations for self-hosted vs API.",
    icon: Cpu,
  },
  {
    week: 3,
    title: "RAG Architecture & Vector Databases",
    description:
      "Retrieval-Augmented Generation from scratch. Embedding models, chunking strategies, vector DB selection (Pinecone vs Weaviate vs pgvector vs Qdrant), hybrid search, reranking, and evaluation frameworks.",
    icon: Database,
  },
  {
    week: 4,
    title: "LLM Orchestration & AI Agent Infrastructure",
    description:
      "Building internal AI platforms. LLM gateways, prompt management, guardrails, tool-use and function calling, multi-agent systems, LangChain vs LlamaIndex vs custom, and observability (LangSmith, Phoenix).",
    icon: Brain,
  },
  {
    week: 5,
    title: "Security, Governance & EU AI Act Compliance",
    description:
      "AI threat models (prompt injection, data exfiltration, model poisoning), EU AI Act risk classification, model auditing, data lineage, PII handling in LLM pipelines, and governance frameworks that don't kill velocity.",
    icon: Shield,
  },
  {
    week: 6,
    title: "Your AI Platform Roadmap — Build It Live",
    description:
      "Assemble your complete AI Platform Roadmap. Architecture diagrams, vendor decisions, team structure, budget projection, compliance checklist, and 90-day action plan. Peer review with cohort.",
    icon: Target,
  },
];

const genaiCapabilities = [
  {
    icon: Brain,
    title: "LLM Strategy",
    desc: "Open-source vs proprietary, fine-tuning vs RAG, cost-per-token analysis, model selection framework.",
  },
  {
    icon: Database,
    title: "RAG & Vector Search",
    desc: "Production RAG pipelines, embedding strategies, vector DB selection, evaluation and quality metrics.",
  },
  {
    icon: Layers,
    title: "AI Agent Platforms",
    desc: "Multi-agent architectures, tool orchestration, guardrails, memory systems, and human-in-the-loop patterns.",
  },
  {
    icon: Cpu,
    title: "Inference at Scale",
    desc: "GPU orchestration, model serving (vLLM, TGI), batching, quantization, and latency optimization.",
  },
  {
    icon: Lock,
    title: "AI Security & Governance",
    desc: "Prompt injection defense, PII filtering, output moderation, EU AI Act compliance, and audit trails.",
  },
  {
    icon: Globe,
    title: "Internal AI Platforms",
    desc: "Build-vs-buy decisions, API gateway design, usage metering, cost allocation, and developer experience.",
  },
];

const included = [
  { icon: BookOpen, text: "12 live sessions (90 min each, recorded)" },
  { icon: Brain, text: "GenAI Architecture Decision Framework" },
  { icon: BarChart3, text: "AI Platform Assessment Tool" },
  { icon: Database, text: "Vector DB Comparison Matrix (8 vendors)" },
  { icon: Layers, text: "25+ Vendor Comparison Matrix" },
  { icon: BarChart3, text: "LLM Cost Calculator (API vs self-hosted)" },
  { icon: Shield, text: "EU AI Act Compliance Checklist" },
  { icon: Target, text: "RAG Pipeline Design Worksheet" },
  { icon: CheckCircle2, text: "90-Day Implementation Checklist" },
  { icon: MessageSquare, text: "Private Slack community (lifetime)" },
  { icon: Phone, text: "1:1 Strategy Call with Luca (30 min)" },
];

const forYou = [
  "CTO, CIO, VP of Engineering, or Head of AI at 500+ employee companies",
  "Leaders deploying GenAI (chatbots, copilots, RAG) to production",
  "Regulated industries — finance, healthcare, government, energy",
  "Teams drowning in AI vendor pitches and need a neutral framework",
  "Organizations where AI prototypes work great but production deployments fail",
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
    a: "We run 4 cohorts per year. Join the waitlist to be notified when the next one opens. Cohorts fill fast — the last one sold out in 9 days.",
  },
  {
    q: "How is this different from AI courses on Coursera or Udemy?",
    a: "Those teach you how AI works. This teaches you how to build the platform that runs AI in production. It's infrastructure strategy, not data science. You'll leave with a board-ready roadmap, not a certificate.",
  },
  {
    q: "What if I miss a live session?",
    a: "All sessions are recorded and available within 24 hours. You can also ask questions asynchronously in the private Slack community.",
  },
  {
    q: "Is this technical?",
    a: "It's technical enough to make real decisions, but you won't write code. Think \"executive technical literacy\" — you'll understand RAG architectures, GPU economics, and LLM orchestration well enough to lead your team effectively.",
  },
  {
    q: "Can I expense this?",
    a: "Yes. We provide invoices and certificates of completion. Most participants expense this through L&D or professional development budgets. At €2,500, it's well within most companies' €2–5K annual training budgets.",
  },
  {
    q: "What's the time commitment?",
    a: "3 hours per week for live sessions plus 1-2 hours for assignments. Assignments are practical — you're building your actual AI platform roadmap, not busywork.",
  },
  {
    q: "Do you offer refunds?",
    a: "Full refund within 14 days if the program isn't what you expected. No questions asked.",
  },
  {
    q: "We already use ChatGPT/Copilot. Why do we need this?",
    a: "Using AI tools and building an AI platform are completely different things. When your CEO asks \"why can't we build our own copilot?\" — this program gives you the answer, the architecture, and the roadmap to actually do it.",
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
      <section className="relative border-b overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/40 via-background to-purple-950/30" />
        <div className="relative container mx-auto px-4 py-20 lg:py-28 text-center">
          <Badge variant="secondary" className="mb-4 text-sm px-4 py-1.5">
            🔥 Only 20 seats per cohort — next cohort filling now
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Your Board Wants an AI Strategy.
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Give Them a Platform.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-xl text-muted-foreground leading-relaxed">
            The 6-week live program that gives CTOs, CIOs, and engineering
            leaders a battle-tested blueprint for building GenAI platforms —
            RAG pipelines, LLM orchestration, AI agents — that actually work
            in regulated enterprises.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" asChild>
              <Link href="#pricing">
                Reserve Your Seat <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6" asChild>
              <Link href="#curriculum">See the Curriculum</Link>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">📚 8 Published Books</span>
            <span className="flex items-center gap-2">🎥 1M+ YouTube Views</span>
            <span className="flex items-center gap-2">🎤 KubeCon & Red Hat Summit Speaker</span>
            <span className="flex items-center gap-2">🏛️ Enterprise AI Architect</span>
          </div>
        </div>
      </section>

      {/* The GenAI Problem */}
      <section className="container mx-auto px-4 py-16 lg:py-20">
        <div className="mx-auto max-w-3xl">
          <Badge variant="outline" className="mb-4">The Reality Check</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            GenAI Changed Everything — Except the Failure Rate
          </h2>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            ChatGPT made AI feel easy. Your board saw the demos. Now they want an
            internal copilot, a customer-facing chatbot, automated document
            processing, and AI-powered search — all by Q3. But here&apos;s what
            the demos didn&apos;t show:
          </p>
          <div className="mt-8 space-y-4">
            {[
              "Your RAG prototype returns hallucinated answers with 100% confidence — and nobody knows how to measure quality",
              "The LLM API costs that looked cheap in testing hit €40K/month at production scale",
              "Your legal team discovers customer data is being sent to OpenAI's API — in a GDPR-regulated environment",
              "Fine-tuning a model took 3 engineers, 2 months, and €80K in GPU costs — then performed worse than the base model",
              "Every team built their own AI integration — you now have 7 different LLM wrappers, zero governance, and a security nightmare",
              "Six months and €500K later, you're back to buying a vendor solution anyway",
            ].map((pain) => (
              <div key={pain} className="flex gap-3">
                <span className="mt-0.5 flex-shrink-0 text-destructive font-bold">✗</span>
                <p className="text-muted-foreground">{pain}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 rounded-xl border-2 border-primary/20 bg-gradient-to-r from-blue-950/30 to-purple-950/30 p-8">
            <p className="text-xl font-bold">
              You don&apos;t have an AI problem. You have a platform problem.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              87% of AI projects never make it to production — and GenAI made it
              worse. The gap between &quot;it works in a notebook&quot; and &quot;it runs
              in production with governance&quot; has never been wider. The companies
              winning at AI aren&apos;t the ones with the best models. They&apos;re
              the ones with the best platforms.
            </p>
          </div>
        </div>
      </section>

      {/* GenAI Capabilities Grid */}
      <section className="border-y bg-muted/20">
        <div className="container mx-auto px-4 py-16 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="outline" className="mb-4">What You&apos;ll Master</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              The GenAI Infrastructure Playbook
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Every decision you need to make — from LLM selection to production
              RAG to EU AI Act compliance — in one structured program.
            </p>
          </div>
          <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {genaiCapabilities.map((item) => (
              <Card key={item.title} className="bg-background/60 backdrop-blur">
                <CardHeader className="pb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What You Walk Away With */}
      <section className="container mx-auto px-4 py-16 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="outline" className="mb-4">Outcomes</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            What You Walk Away With
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Not slides. Not theory. Artifacts you can use Monday morning.
          </p>
        </div>
        <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Target,
              title: "AI Platform Roadmap",
              desc: "Board-ready architecture document tailored to your organization, tech stack, and regulatory environment.",
            },
            {
              icon: BarChart3,
              title: "Realistic Budget",
              desc: "GPU costs, API spend, team sizing, vendor costs — a complete TCO model, not back-of-napkin guesses.",
            },
            {
              icon: Shield,
              title: "Governance Framework",
              desc: "EU AI Act risk classification, data governance policies, model audit trails — satisfies regulators AND engineers.",
            },
            {
              icon: Layers,
              title: "Build-vs-Buy Matrix",
              desc: "25+ vendor comparison across LLMs, vector DBs, orchestration, observability — backed by data, not sales decks.",
            },
            {
              icon: Users,
              title: "Team & Hiring Plan",
              desc: "Who to hire (ML engineer vs platform engineer vs AI architect), when, and what to outsource.",
            },
            {
              icon: Clock,
              title: "90-Day Action Plan",
              desc: "Week-by-week implementation plan. Concrete next steps that start Monday, not vague strategy.",
            },
          ].map((item) => (
            <Card key={item.title} className="bg-background">
              <CardHeader className="pb-3">
                <item.icon className="h-8 w-8 text-primary" />
                <CardTitle className="text-lg">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" asChild>
            <Link href="#pricing">
              Reserve Your Seat <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Curriculum */}
      <section id="curriculum" className="border-y bg-muted/20">
        <div className="container mx-auto px-4 py-16 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="outline" className="mb-4">The Curriculum</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              6 Weeks. 12 Live Sessions. One Roadmap.
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Every session is practical. No fluff. No filler. You build your
              AI Platform Roadmap as you go.
            </p>
          </div>
          <div className="mx-auto mt-12 max-w-3xl space-y-6">
            {weeklyTopics.map((week) => (
              <div
                key={week.week}
                className="flex gap-6 rounded-xl border bg-background p-6 transition-colors hover:border-primary/40"
              >
                <div className="flex-shrink-0">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-primary/20">
                    <week.icon className="h-7 w-7 text-primary" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary uppercase tracking-wider">
                    Week {week.week}
                  </p>
                  <h3 className="mt-1 text-lg font-bold">{week.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {week.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mid-page CTA */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950/60 to-purple-950/60" />
        <div className="relative container mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Your Competitors Are Already Building AI Platforms
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Every week you wait, the gap between AI experimentation and AI
            production widens. The next cohort has 20 seats. Don&apos;t be #21.
          </p>
          <div className="mt-8">
            <Button size="lg" className="text-lg px-8 py-6 bg-white text-black hover:bg-gray-100" asChild>
              <Link href="#pricing">
                Claim Your Seat Now <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="container mx-auto px-4 py-16 lg:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                This Program Is For You If:
              </h2>
              <div className="mt-6 space-y-4">
                {forYou.map((item) => (
                  <div key={item} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                    <p className="text-sm text-muted-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                This Is NOT For You If:
              </h2>
              <div className="mt-6 space-y-4">
                {notForYou.map((item) => (
                  <div key={item} className="flex gap-3">
                    <span className="mt-0.5 text-destructive font-bold">✗</span>
                    <p className="text-sm text-muted-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Instructor */}
      <section className="border-y bg-muted/20">
        <div className="container mx-auto px-4 py-16 lg:py-20">
          <div className="mx-auto max-w-3xl">
            <Badge variant="outline" className="mb-4">Your Instructor</Badge>
            <div className="mt-4 rounded-xl border bg-background p-8">
              <h3 className="text-2xl font-bold">Luca Berton</h3>
              <p className="mt-1 text-lg text-primary font-semibold">
                AI Infrastructure Architect · Author · Educator
              </p>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Luca has spent his career building the production-grade platforms
                underneath enterprise AI — securely, at scale, with measurable
                ROI. He&apos;s helped regulated enterprises across Europe move from
                GenAI prototypes to production systems that pass compliance audits
                and deliver real business value.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  "📚 Author of 8 technical books",
                  "🎥 1M+ YouTube views, 793+ tutorials",
                  "🎤 KubeCon EU & Red Hat Summit 2026 speaker",
                  "🏢 Founder of Open Empower BV",
                  "🔧 Kubernetes, Terraform, MLOps at scale",
                  "🏛️ Regulated enterprise specialist (EU)",
                ].map((cred) => (
                  <p key={cred} className="text-sm text-muted-foreground">
                    {cred}
                  </p>
                ))}
              </div>
              <blockquote className="mt-8 rounded-lg border-l-4 border-primary bg-muted/30 p-6 italic text-muted-foreground">
                &quot;Every enterprise I&apos;ve worked with has a brilliant AI team.
                What they don&apos;t have is the platform to put those models into
                production. That&apos;s what kills AI projects — not bad
                science, but missing infrastructure. This program fixes
                that.&quot;
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="container mx-auto px-4 py-16 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="outline" className="mb-4">What&apos;s Included</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything You Need to Build Your AI Platform
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
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-y bg-muted/20">
        <div className="container mx-auto px-4 py-16 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="outline" className="mb-4">Investment</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Less Than One Failed AI POC
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Most companies spend €50–500K on AI projects that never reach
              production. This program costs less than a single wasted sprint.
            </p>
          </div>
          <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-3">
            {/* Individual */}
            <Card className="bg-background">
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
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                    <span>{f}</span>
                  </div>
                ))}
                <MailtoButton className="mt-4 w-full" user="luca" domain="lucaberton.it" subject="AI Platform Engineering - Individual">
                    Reserve Your Seat
                </MailtoButton>
              </CardContent>
            </Card>

            {/* Team */}
            <Card className="border-2 border-primary relative bg-background shadow-lg shadow-primary/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 px-4">Most Popular</Badge>
              </div>
              <CardHeader className="pt-8">
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
                  "Team pricing discount (20%)",
                  "Shared Slack channel",
                  "Invoice / PO available",
                ].map((f) => (
                  <div key={f} className="flex gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                    <span>{f}</span>
                  </div>
                ))}
                <MailtoButton className="mt-4 w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white" user="luca" domain="lucaberton.it" subject="AI Platform Engineering - Team">
                    Contact for Team Pricing
                </MailtoButton>
              </CardContent>
            </Card>

            {/* Enterprise */}
            <Card className="bg-background">
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
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
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
            invoices and certificates of completion. <strong>14-day money-back guarantee</strong> — no questions asked.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 py-16 lg:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-center sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <div className="mt-12 space-y-8">
            {faqs.map((faq) => (
              <div key={faq.q} className="rounded-lg border p-6">
                <h3 className="font-semibold text-lg">{faq.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative border-t overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/50 via-background to-purple-950/40" />
        <div className="relative container mx-auto px-4 py-20 lg:py-24 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Stop Experimenting.
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Start Building Your AI Platform.
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            20 seats. 6 weeks. One roadmap that gets your AI projects from
            prototype to production. The next cohort won&apos;t wait.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <MailtoButton size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" user="luca" domain="lucaberton.it" subject="AI Platform Engineering - Reserve Seat">
                Reserve Your Seat — €2,500 <ArrowRight className="ml-2 h-5 w-5" />
            </MailtoButton>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            14-day money-back guarantee · Invoice available · Questions?{" "}
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
