import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LessonClip } from "@/components/home/lesson-clip";
import { SnapCarousel } from "@/components/home/snap-carousel";
import { cn } from "@/lib/utils";

export interface Promo {
  id: string;
  kicker: string;
  title: string;
  text: string;
  href: string;
  cta: string;
  /** A course cover (16:9). */
  image: string | null;
  accent: "amber" | "emerald";
}

const ACCENT: Record<Promo["accent"], string> = {
  amber: "text-amber-300",
  emerald: "text-emerald-300",
};

const cardClass =
  "flex h-full flex-col rounded-3xl bg-[#0b1120] p-6 text-white sm:p-8";
const ctaClass = "gap-2 bg-white text-slate-950 hover:bg-slate-200";

/**
 * The top of the home page: the brand promise with a real lesson clip, and
 * up to two promo cards next to it. A bento grid from `lg`; below that the
 * cards scroll sideways with dots.
 */
export function PromoBento({ promos }: { promos: Promo[] }) {
  const shown = promos.slice(0, 2);
  return (
    <section aria-label="Start here" className="pb-4 pt-6 lg:pt-8">
      <div className="container mx-auto px-4">
        <SnapCarousel
          label="Start here"
          listClassName="lg:mx-0 lg:grid lg:grid-cols-2 lg:gap-5 lg:overflow-visible lg:px-0 xl:grid-cols-12 xl:grid-rows-2"
          itemClassName={[
            cn(
              "w-[88%] sm:w-[70%] lg:col-span-2 lg:w-auto xl:row-span-2",
              shown.length > 0 ? "xl:col-span-7" : "xl:col-span-12"
            ),
            ...shown.map(() =>
              cn(
                "w-[88%] sm:w-[70%] lg:w-auto xl:col-span-5",
                shown.length === 1 && "lg:col-span-2 xl:row-span-2"
              )
            ),
          ]}
          dotsClassName="lg:hidden"
        >
          {/* Between lg and xl the lead card is a full row: text left, clip right. */}
          <article
            className={cn(
              cardClass,
              "lg:p-10 lg:max-xl:grid lg:max-xl:grid-cols-2 lg:max-xl:items-center lg:max-xl:gap-10"
            )}
          >
            {/* From xl the card is as tall as the two cards beside it. The
                text block takes any spare height, so the button stays with
                the clip and there is no empty band above the clip. */}
            <div className="xl:flex xl:flex-1 xl:flex-col xl:justify-between">
              <div>
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl xl:text-6xl">
                  Copy. Paste. <span className="text-emerald-400">Learn.</span>
                </h1>
                <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-200">
                  Short video lessons where every command is on screen. You
                  run it, you see what it does, you understand why.
                </p>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
                <Button size="lg" className={cn(ctaClass, "px-6 text-base")} asChild>
                  <Link href="/courses">
                    Start a free lesson
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
                <p className="max-w-[16rem] text-sm text-slate-300">
                  The first lesson of every course is free. No signup, no card.
                </p>
              </div>
            </div>
            <div className="mt-8 lg:max-xl:mt-0">
              <LessonClip
                src="/videos/lesson-preview.mp4"
                poster="/videos/lesson-preview.jpg"
                caption="14 seconds of a real lesson: Install Ollama and run your first model."
              />
            </div>
          </article>

          {shown.map((promo) => (
            <article key={promo.id} className={cardClass}>
              <p
                className={cn(
                  "text-xs font-semibold",
                  ACCENT[promo.accent]
                )}
              >
                {promo.kicker}
              </p>
              <h2 className="mt-3 max-w-[24ch] text-2xl font-bold tracking-tight">
                {promo.title}
              </h2>
              <p className="mt-2 max-w-[40ch] leading-relaxed text-slate-300">
                {promo.text}
              </p>
              {/* Phone and tablet: cover above the button. From lg: button left, cover right. */}
              <div className="mt-auto flex flex-col gap-5 pt-6 lg:flex-row-reverse lg:items-end lg:justify-between lg:gap-4">
                {promo.image && (
                  <div className="flex min-w-0 lg:flex-1 lg:justify-end">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={promo.image}
                      alt=""
                      width={800}
                      height={450}
                      loading="lazy"
                      decoding="async"
                      className="aspect-video w-full max-w-sm rounded-lg border border-white/15 object-cover lg:max-w-[14.5rem] xl:max-w-[12.5rem]"
                    />
                  </div>
                )}
                <Button className={cn(ctaClass, "shrink-0 self-start lg:self-auto")} asChild>
                  <Link href={promo.href}>
                    {promo.cta}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </article>
          ))}
        </SnapCarousel>
      </div>
    </section>
  );
}
