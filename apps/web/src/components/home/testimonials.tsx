import { CheckCircle2 } from "lucide-react";
import { SnapCarousel } from "@/components/home/snap-carousel";
import type { Testimonial } from "@/lib/testimonials";

/**
 * Learner quotes as a row of bordered cards: who on top, what they said
 * below. Three columns from `md`; a sideways-scrolling row with dots on a
 * phone.
 */
export function Testimonials({ items }: { items: Testimonial[] }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="home-learners" className="border-t py-12 lg:py-16">
      <div className="container mx-auto px-4">
        <h2
          id="home-learners"
          className="text-2xl font-bold tracking-tight sm:text-3xl"
        >
          What our learners say
        </h2>
        <div className="mt-6">
          <SnapCarousel
            label="What our learners say"
            listClassName="md:mx-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0"
            itemClassName="w-[85%] sm:w-[60%] md:w-auto"
            dotsClassName="md:hidden"
            focusableList
          >
            {items.map((t) => (
              <figure
                key={t.name}
                className="flex h-full flex-col rounded-2xl border bg-card p-5 sm:p-6"
              >
                <figcaption>
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {t.role} — {t.company}
                  </p>
                </figcaption>
                <blockquote className="mt-4 flex-1 leading-relaxed">
                  &ldquo;{t.text}&rdquo;
                </blockquote>
                <p className="mt-5 flex items-center gap-2 border-t pt-4 text-sm font-medium">
                  <CheckCircle2
                    className="h-4 w-4 shrink-0 text-emerald-600"
                    aria-hidden="true"
                  />
                  {t.outcome}
                </p>
              </figure>
            ))}
          </SnapCarousel>
        </div>
      </div>
    </section>
  );
}
