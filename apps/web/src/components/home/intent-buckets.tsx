import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Bucket {
  href: string;
  title: string;
  text: string;
  icon: LucideIcon;
  tone: "amber" | "emerald" | "slate";
}

const TONE: Record<Bucket["tone"], string> = {
  amber: "border-amber-200 bg-amber-50",
  emerald: "border-emerald-200 bg-emerald-50",
  slate: "border-slate-200 bg-slate-100",
};

/** Three large links for the three reasons people come to the site. */
export function IntentBuckets({ buckets }: { buckets: Bucket[] }) {
  return (
    <section aria-label="Where to go next" className="py-10 lg:py-14">
      <div className="container mx-auto px-4">
        <ul className="grid gap-4 md:grid-cols-3 md:gap-5">
          {buckets.map((bucket) => (
            <li key={bucket.href}>
              <Link
                href={bucket.href}
                className={cn(
                  "group flex h-full items-start gap-4 rounded-2xl border p-5 text-slate-950 outline-none transition-[box-shadow,transform] duration-200 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-safe:hover:-translate-y-0.5 sm:p-6",
                  TONE[bucket.tone]
                )}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white">
                  <bucket.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-lg font-semibold tracking-tight">
                      {bucket.title}
                    </span>
                    <ArrowRight
                      className="h-4 w-4 shrink-0 transition-transform motion-safe:group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-slate-700">
                    {bucket.text}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
