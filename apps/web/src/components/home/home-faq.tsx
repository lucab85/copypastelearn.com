import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { FaqItem } from "@/lib/home-faq";

/**
 * FAQ as native disclosure elements (keyboard and screen reader support come
 * from the browser, no script), with FAQPage structured data of the same text.
 */
export function HomeFaq({ items }: { items: FaqItem[] }) {
  if (items.length === 0) return null;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
  return (
    <section aria-labelledby="home-faq" className="border-t py-12 lg:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container mx-auto grid gap-8 px-4 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-12">
        <h2
          id="home-faq"
          className="text-2xl font-bold tracking-tight sm:text-3xl"
        >
          Frequently asked questions
        </h2>
        <div className="max-w-3xl divide-y rounded-2xl border">
          {items.map((item) => (
            <details key={item.question} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-4 text-left font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                {item.question}
                <ChevronDown
                  className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </summary>
              <div className="px-5 pb-5 leading-relaxed text-muted-foreground">
                <p>{item.answer}</p>
                {item.link && (
                  <p className="mt-3">
                    <Link
                      href={item.link.href}
                      className="font-medium text-foreground underline underline-offset-4"
                    >
                      {item.link.label}
                    </Link>
                  </p>
                )}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
