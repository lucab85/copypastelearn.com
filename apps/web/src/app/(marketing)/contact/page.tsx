import type { Metadata } from "next";
import { Mail, MessageSquare, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the CopyPasteLearn team. Questions, partnerships, or feedback — we'd love to hear from you.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div>
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-12 lg:py-16">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Contact Us
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            Have a question, suggestion, or partnership idea? We&apos;d love to
            hear from you.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-3">
          {[
            {
              icon: Mail,
              title: "Email",
              description: "hello@copypastelearn.com",
              href: "mailto:hello@copypastelearn.com",
            },
            {
              icon: MessageSquare,
              title: "Discord",
              description: "Join our community",
              href: "https://discord.gg/copypastelearn",
            },
            {
              icon: MapPin,
              title: "Location",
              description: "Remote-first, worldwide",
              href: null,
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
              {item.href ? (
                <a
                  href={item.href}
                  className="text-sm text-muted-foreground underline underline-offset-4 hover:text-primary"
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel={
                    item.href.startsWith("http")
                      ? "noopener noreferrer"
                      : undefined
                  }
                >
                  {item.description}
                </a>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
