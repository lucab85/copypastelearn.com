import type { Metadata } from "next";
import { Terminal, Users, Rocket } from "lucide-react";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about CopyPasteLearn — our mission to make IT automation education hands-on and accessible.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div>
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
            <h2 className="text-2xl font-semibold">Get in Touch</h2>
            <p className="leading-relaxed text-muted-foreground">
              Have questions or want to collaborate? Reach out at{" "}
              <a
                href="mailto:hello@copypastelearn.com"
                className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
              >
                hello@copypastelearn.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
