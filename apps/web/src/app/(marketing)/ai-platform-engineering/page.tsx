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
  BarChart3,
  Layers,
  Target,
  Users,
  BookOpen,
  MessageSquare,
  Phone,
  ArrowRight,
  AlertTriangle,
  Brain,
  Scale,
  Coins,
  Map,
  FileCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "AI Platform Engineering — Executive Decision Lab",
  description:
    "An 8-session Executive Decision Lab for CTOs, VPs, and senior architects in regulated enterprises. Turn AI pilots into a board-ready platform roadmap — vendor-neutral, anchored to NIST AI RMF, ISO/IEC 42001, and the EU AI Act.",
  alternates: { canonical: "/ai-platform-engineering" },
  openGraph: {
    url: "/ai-platform-engineering",
    title: "AI Platform Engineering for Enterprise Leaders",
    description:
      "Stop burning budget on AI pilots that never reach production. 8 sessions, 7 decision artifacts, one board-ready AI platform roadmap.",
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
      "An 8-session Executive Decision Lab for CTOs, CIOs, VPs, and senior architects building AI platforms in regulated enterprises. Produces seven decision artifacts and a board-ready AI platform roadmap with a 90-day action plan. Vendor-neutral; anchored to NIST AI RMF, ISO/IEC 42001, the EU AI Act, OWASP Top 10 for LLMs, and FinOps for AI.",
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
      url: "https://lucaberton.com",
    },
    educationalLevel: "Executive",
    timeRequired: "PT24H",
    numberOfCredits: 8,
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "Online",
      courseSchedule: {
        "@type": "Schedule",
        repeatFrequency: "P1W",
        repeatCount: 8,
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

const sessions = [
  {
    session: 1,
    title: "Why Enterprise AI Fails",
    description:
      "The three enterprise failure patterns — cost blowout, compliance block, and org misalignment. Score your organization on a five-level AI Platform Maturity Model across eight dimensions, then set your baseline, 12-month target, and #1 priority gap.",
    artifact: "AI Platform Scorecard",
    icon: AlertTriangle,
  },
  {
    session: 2,
    title: "The Right-Sized AI Strategy",
    description:
      "Turn a list of 15 AI ideas into a funded short list. Score use cases on value, feasibility, risk, and time-to-value, then make a defensible fund / fund-with-gates / kill call — with success metrics that go beyond model accuracy.",
    artifact: "Use-Case Prioritization Matrix",
    icon: Target,
  },
  {
    session: 3,
    title: "Budget & Economics: What AI Really Costs",
    description:
      "Why AI cost structure inverts from POC to production. Build a CFO-readable TCO across the four cost drivers — Build, Run, Usage, People — with conservative/expected/high scenarios and FinOps guardrails that each have a trigger, an action, and an owner.",
    artifact: "Budget Model + Cost Guardrails",
    icon: Coins,
  },
  {
    session: 4,
    title: "Build vs. Buy: Vendor Strategy Without Getting Sold ‘Magic’",
    description:
      "Decide build / buy / hybrid by platform layer on six weighted criteria. Spot the commercial traps — consumption pricing, proprietary APIs, the upsell staircase, compliance theater — and score the exit and portability cost before you sign.",
    artifact: "Vendor Decision Framework",
    icon: Scale,
  },
  {
    session: 5,
    title: "Operating Model: Who Owns What",
    description:
      "Org misalignment is the #1 non-technical cause of AI failure. Decide what to centralize, federate, and jointly govern; build a RACI with exactly one accountable owner per decision; and close the gaps with a hire / upskill / partner / redesign team plan.",
    artifact: "RACI Matrix + Team Plan",
    icon: Users,
  },
  {
    session: 6,
    title: "Governance & Compliance: EU AI Act-Ready Without Killing Delivery",
    description:
      "Right-sized, risk-based governance built into the lifecycle — not bolted on at the end. Classify use cases by risk tier, assign controls and evidence by domain, stand up an AI-system registry, and design an approval flow your auditors trust.",
    artifact: "Governance Blueprint",
    icon: Shield,
  },
  {
    session: 7,
    title: "GenAI Decisions Leaders Must Get Right",
    description:
      "The four GenAI decisions leaders must own: hosting, retrieval (RAG vs fine-tuning), data boundaries, and IP protection. Add the security lens (OWASP Top 10 for LLMs) and model cost as an operating behavior at 10x, 50x, and 100x usage.",
    artifact: "GenAI Architecture Decision Tree",
    icon: Brain,
  },
  {
    session: 8,
    title: "The Roadmap: From Today to 90 Days to 12 Months",
    description:
      "Assemble all seven artifacts into one board-ready roadmap and a 90-day action plan. Present it in board-pitch format and survive the five questions every board asks: value, cost, risk, ownership, and timeline.",
    artifact: "Board-Ready Roadmap + 90-Day Action Plan",
    icon: Map,
  },
];

const decisionLayers = [
  {
    icon: Target,
    title: "Strategy",
    desc: "Which AI use cases deserve investment — and which to kill? Prioritize on value, feasibility, risk, and time-to-value.",
  },
  {
    icon: Coins,
    title: "Economics",
    desc: "What will AI really cost at production scale? The four cost drivers, scenario ranges, and FinOps guardrails with named owners.",
  },
  {
    icon: Layers,
    title: "Platform",
    desc: "What shared capabilities do we need to build once and reuse? The golden path that makes autonomy safe.",
  },
  {
    icon: Scale,
    title: "Vendors",
    desc: "What do we build, buy, or avoid — by platform layer — without locking ourselves into a 12-month migration out?",
  },
  {
    icon: Users,
    title: "Operating Model",
    desc: "Who owns what in production? Centralize, federate, or jointly govern — with exactly one accountable owner per decision.",
  },
  {
    icon: Shield,
    title: "Governance",
    desc: "How do we manage risk and prove compliance without killing delivery? Risk tiers, controls, evidence, and an AI-system registry.",
  },
  {
    icon: Brain,
    title: "GenAI Architecture",
    desc: "Which technical decisions must we get right early? Hosting, retrieval, data boundaries, and IP protection.",
  },
  {
    icon: Map,
    title: "Roadmap",
    desc: "How do we turn all of this into funded execution? A board-ready roadmap and a 90-day plan that passes the Monday-morning test.",
  },
];

const included = [
  { icon: BookOpen, text: "8 live Executive Decision Lab sessions (recorded)" },
  { icon: FileCheck, text: "One executive-ready artifact per session" },
  { icon: BarChart3, text: "AI Platform Maturity Scorecard (8 dimensions)" },
  { icon: Target, text: "Use-Case Prioritization Matrix + success metrics" },
  { icon: Coins, text: "AI Budget Model + FinOps cost guardrails" },
  { icon: Scale, text: "Vendor Decision Framework (6 weighted criteria)" },
  { icon: Users, text: "RACI Matrix + Team Plan templates" },
  { icon: Shield, text: "Governance Blueprint (EU AI Act-ready)" },
  { icon: Brain, text: "GenAI Architecture Decision Tree + risk checklist" },
  { icon: Map, text: "Board-Ready Roadmap + 90-Day Action Plan template" },
  { icon: MessageSquare, text: "Private peer cohort under the Chatham House Rule" },
  { icon: Phone, text: "1:1 strategy call with Luca (30 min)" },
];

const forYou = [
  "CTO, CIO, VP of Engineering, or Head of AI in regulated enterprises",
  "Senior architects and platform leaders accountable for AI decisions to a board",
  "Leaders with AI pilots — but no approvable, funded plan",
  "Teams drowning in AI vendor pitches who need a neutral decision framework",
  "Organizations where AI prototypes work but production stalls on cost, compliance, or ownership",
];

const notForYou = [
  "Looking for a coding bootcamp (this is executive decisions, not implementation)",
  "Want a €15 Udemy course (this is a professional investment)",
  "Very early-stage companies with no AI initiatives yet",
  "Want vendor-specific training (this program is deliberately vendor-neutral)",
];

const faqs = [
  {
    q: "When does the next cohort start?",
    a: "We run 4 cohorts per year. Join the waitlist to be notified when the next one opens. Cohorts fill fast — the last one sold out in 9 days.",
  },
  {
    q: "How is this different from AI courses on Coursera or Udemy?",
    a: "Those teach you how AI works. This is an Executive Decision Lab that produces the decisions — and the board-ready roadmap — that get AI into production. It's leadership strategy, not data science: vendor-neutral, and anchored to NIST AI RMF, ISO/IEC 42001, and the EU AI Act. You leave with a plan, not a certificate.",
  },
  {
    q: "What if I miss a live session?",
    a: "All sessions are recorded and available within 24 hours. You can also ask questions asynchronously in the private cohort community.",
  },
  {
    q: "Is this technical?",
    a: "It's executive-first — decisions, not implementation detail. You won't write code or configure GPUs. You'll make the hosting, retrieval, vendor, cost, governance, and ownership decisions well enough to lead your team and defend them to your board.",
  },
  {
    q: "Is the program vendor-neutral?",
    a: "Yes — completely. The entire program is criteria, not brands. You leave with reusable decision frameworks, not a recommendation to buy a specific vendor.",
  },
  {
    q: "What is the Chatham House Rule, and why does it matter?",
    a: "You can use every idea, pattern, and lesson freely — but you never attribute who said what or where they work. It's what lets senior leaders name real blockers honestly, which is where the value is.",
  },
  {
    q: "Can I expense this?",
    a: "Yes. We provide invoices and certificates of completion. Most participants expense this through L&D or professional development budgets. At €2,500, it's well within most companies' €2–5K annual training budgets.",
  },
  {
    q: "What's the time commitment?",
    a: "Each session is a working session, plus a short assignment that builds one artifact of your actual roadmap — not busywork. Bring a real initiative and you'll leave with a plan you can defend on Monday.",
  },
  {
    q: "Do you offer refunds?",
    a: "Full refund within 14 days if the program isn't what you expected. No questions asked.",
  },
  {
    q: "We already use ChatGPT/Copilot. Why do we need this?",
    a: "Using AI tools and operating an AI platform are completely different things. When your CEO asks \"why can't we build our own copilot?\" — this program gives you the decisions, the governance, and the board-ready roadmap to actually do it.",
  },
  {
    q: "I'm not a CIO/CTO. Can I still join?",
    a: "Absolutely — if you're involved in AI platform decisions (Platform Lead, ML Engineering Manager, Solutions Architect, senior architect), you'll get massive value.",
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
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-blue-300/80">
            Enterprise AI Platform Blueprint · Regulated-Ready
          </p>
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
            The 8-session Executive Decision Lab where CTOs, CIOs, VPs, and
            senior architects in regulated enterprises turn AI pilots into a
            board-ready platform roadmap — vendor-neutral, and anchored to the
            frameworks your risk team already trusts.
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
            Most Enterprise AI Efforts Stall — And It&apos;s Rarely the Model
          </h2>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            Your board saw the demos and wants an internal copilot, a
            customer-facing assistant, and automated document processing — all by
            Q3. But the demo hid the hard parts, and they&apos;re leadership
            decisions, not engineering:
          </p>
          <div className="mt-8 space-y-4">
            {[
              "Cost blowout: $500K modeled, $2.1M spent 18 months later — and still nothing in production, because the POC budget priced the technology, not the operating system around it",
              "Compliance block: a production-ready model sat blocked for ~9 months because governance was bolted on after the build, not designed into the platform",
              "Org misalignment: four teams built four pipelines, four security reviews, four cost centers — and no one could answer \"who owns AI in production?\"",
              "Runaway economics: inference that looked trivial in the POC went from $0 to $500K in three months once every workflow multiplied it at production volume",
              "Pilot sprawl: every function wants its own AI win, so funding spreads across ten pilots and none of them reaches production",
              "No defensible number: your CFO isn't anti-AI — they're anti-unclear economics, and no one walked in with a budget range, assumptions, and guardrails",
            ].map((pain) => (
              <div key={pain} className="flex gap-3">
                <span className="mt-0.5 flex-shrink-0 text-destructive font-bold">✗</span>
                <p className="text-muted-foreground">{pain}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 rounded-xl border-2 border-primary/20 bg-gradient-to-r from-blue-950/30 to-purple-950/30 p-8">
            <p className="text-xl font-bold">
              The question is not &quot;can we build AI?&quot; It&apos;s &quot;can we operate AI?&quot;
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Enterprise AI failure is usually a maturity problem, not a model
              problem — it spans strategy, cost, governance, ownership, and
              architecture. A proof of concept proves possibility; it never
              proves readiness. The organizations winning at AI aren&apos;t the
              ones with the best models. They&apos;re the ones that can operate AI
              in production — safely, economically, and with a named owner.
            </p>
          </div>
        </div>
      </section>

      {/* GenAI Capabilities Grid */}
      <section className="border-y bg-muted/20">
        <div className="container mx-auto px-4 py-16 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="outline" className="mb-4">What You&apos;ll Decide</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Eight Decision Layers. Eight Questions Your Board Will Ask.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              One model holds the whole program — from an honest maturity baseline
              to a funded, board-ready roadmap. Vendor-neutral throughout:
              criteria, not brands.
            </p>
          </div>
          <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {decisionLayers.map((item) => (
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
            Seven Artifacts. One Board-Ready Roadmap.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Not slides. Not theory. One executive-ready artifact per session —
            assembled into a plan you can defend on Monday morning.
          </p>
        </div>
        <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: BarChart3,
              title: "AI Platform Scorecard",
              desc: "A five-level maturity model across eight dimensions — your honest baseline, 12-month target, and #1 priority gap.",
            },
            {
              icon: Target,
              title: "Use-Case Prioritization Matrix",
              desc: "Every use case scored on value, feasibility, risk, and time-to-value — with a defensible fund / gate / kill call.",
            },
            {
              icon: Coins,
              title: "Budget Model + Guardrails",
              desc: "A CFO-readable TCO across Build, Run, Usage, and People — with scenario ranges and FinOps guardrails that have owners.",
            },
            {
              icon: Scale,
              title: "Vendor Decision Framework",
              desc: "Build / buy / hybrid by platform layer on six weighted criteria — including the exit and portability cost everyone forgets.",
            },
            {
              icon: Users,
              title: "RACI Matrix + Team Plan",
              desc: "Exactly one accountable owner per decision, a golden path for delivery, and a hire / upskill / partner / redesign plan.",
            },
            {
              icon: Shield,
              title: "Governance Blueprint",
              desc: "Risk tiers, controls and evidence by domain, an AI-system registry, and an approval flow — EU AI Act-ready, not delivery-killing.",
            },
            {
              icon: Brain,
              title: "GenAI Architecture Decision Tree",
              desc: "Hosting, retrieval, data boundaries, and IP protection decided for a real use case — each with a rationale, risk, and mitigation.",
            },
            {
              icon: Map,
              title: "Board-Ready Roadmap + 90-Day Plan",
              desc: "Seven artifacts assembled into one funded, governed roadmap and a 90-day plan that passes the Monday-morning test.",
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
              8 Sessions. 7 Artifacts. One Board-Ready Roadmap.
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              An Executive Decision Lab — not a lecture series. Nine frameworks
              across eight working sessions, each run under the Chatham House Rule
              and ending with one artifact you take straight into your roadmap.
            </p>
          </div>
          <div className="mx-auto mt-12 max-w-3xl space-y-6">
            {sessions.map((session) => (
              <div
                key={session.session}
                className="flex gap-6 rounded-xl border bg-background p-6 transition-colors hover:border-primary/40"
              >
                <div className="flex-shrink-0">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-primary/20">
                    <session.icon className="h-7 w-7 text-primary" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary uppercase tracking-wider">
                    Session {session.session}
                  </p>
                  <h3 className="mt-1 text-lg font-bold">{session.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {session.description}
                  </p>
                  <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                    <FileCheck className="h-3.5 w-3.5" />
                    Artifact: {session.artifact}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mid-page CTA */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950 to-purple-950" />
        <div className="relative container mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Your Competitors Are Already Building AI Platforms
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-blue-100/90">
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
                  "8 live Decision Lab sessions + recordings",
                  "All 7 artifact templates & tools",
                  "Private cohort community (Chatham House Rule)",
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
                  "Shared private cohort channel",
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
            8 sessions. 7 artifacts. One board-ready roadmap that gets your AI
            initiatives from pilot to funded production. The next cohort
            won&apos;t wait.
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
