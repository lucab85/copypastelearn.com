import type { Metadata } from "next";
import Link from "next/link";
import { Terminal, Users, Rocket } from "lucide-react";
import { EmailLink } from "@/components/ui/email-link";

export const metadata: Metadata = {
  title: "About",
  description:
    "CopyPasteLearn makes IT automation hands-on and accessible. Watch expert video lessons, then practise in real sandbox environments — no setup required.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About CopyPasteLearn",
    description:
      "Our mission: make IT automation education hands-on and accessible to everyone.",
  },
  twitter: {
    card: "summary_large_image",
    site: "@copypastelearn",
    creator: "@yourlinuxsa",
    title: "About CopyPasteLearn",
    description:
      "Our mission: make IT automation education hands-on and accessible to everyone.",
  },
};

function AboutPageJsonLd() {
  const siteUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://www.copypastelearn.com";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About CopyPasteLearn",
    url: `${siteUrl}/about`,
    description:
      "Learn about CopyPasteLearn — hands-on IT automation education with video courses and interactive labs.",
    mainEntity: {
      "@type": "Organization",
      name: "CopyPasteLearn",
      url: siteUrl,
      founder: {
        "@type": "Person",
        name: "Luca Berton",
        url: "https://www.lucaberton.com",
        jobTitle: "IT Automation Expert & Instructor",
        sameAs: [
          "https://www.lucaberton.com",
          "https://twitter.com/yourlinuxsa",
          "https://www.ansiblepilot.com",
        ],
      },
      sameAs: [
        "https://github.com/copypastelearn",
        "https://twitter.com/copypastelearn",
      ],
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default function AboutPage() {
  return (
    <div>
      <AboutPageJsonLd />
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-12 lg:py-16">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            About CopyPasteLearn
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            We believe the best way to learn IT automation is by doing it.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-3xl space-y-12">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Our Mission</h2>
            <p className="leading-relaxed text-muted-foreground">
              CopyPasteLearn was founded with a simple idea: learning IT
              automation shouldn&apos;t require hours of setup before you write
              your first line of code. We provide expert-led video courses
              paired with real, ephemeral sandbox environments so you can
              practice immediately — no local installs, no configuration
              headaches.
            </p>
          </section>

          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                icon: Terminal,
                title: "Hands-On First",
                description:
                  "Every course includes interactive labs where you practice in real environments.",
              },
              {
                icon: Users,
                title: "Built for Pros",
                description:
                  "Designed for busy IT professionals who need practical skills, not just theory.",
              },
              {
                icon: Rocket,
                title: "Always Evolving",
                description:
                  "New courses and labs added regularly to cover the latest tools and practices.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border bg-card p-6 text-center"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">The Instructor</h2>
            <div className="rounded-xl border bg-card p-6">
              <h3 className="text-lg font-semibold">Luca Berton</h3>
              <p className="mt-1 text-sm font-medium text-primary">
                IT Automation Expert & Instructor
              </p>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                Luca is an IT automation expert with extensive experience in
                Ansible, Docker, Kubernetes, and Terraform. He&apos;s the author
                of{" "}
                <a
                  href="https://www.ansiblepilot.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
                >
                  Ansible Pilot
                </a>{" "}
                and has helped thousands of professionals automate their
                infrastructure through hands-on training.
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <a
                  href="https://www.lucaberton.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  lucaberton.com
                </a>
                <span className="text-muted-foreground/30">·</span>
                <a
                  href="https://twitter.com/yourlinuxsa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  @yourlinuxsa
                </a>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Get in Touch</h2>
            <p className="leading-relaxed text-muted-foreground">
              Have questions or want to collaborate? Reach out at{" "}
              <EmailLink
                user="hello"
                domain="copypastelearn.com"
                className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
              />
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
