"use client";

import Link from "next/link";
import * as Tabs from "@radix-ui/react-tabs";
import { ArrowRight } from "lucide-react";
import type { CourseListItem, UpcomingCourse } from "@copypastelearn/shared";
import { CourseCard } from "@/components/course/course-card";
import { ComingSoonCard } from "@/components/course/coming-soon-card";

export interface SpotlightTrack {
  anchor: string;
  title: string;
  tagline: string;
  /** "5 courses, 1 coming soon" */
  count: string;
  /** At most four cards in total: published first, then coming soon. */
  courses: CourseListItem[];
  upcoming: UpcomingCourse[];
}

/**
 * The dark band: a short pitch on the left, the tracks as filter chips and
 * four course cards of the chosen track on the right. The chips are tabs
 * (arrow keys move between them); every track's cards are in the page.
 */
export function TrackSpotlight({ tracks }: { tracks: SpotlightTrack[] }) {
  if (tracks.length === 0) return null;
  return (
    <section
      aria-labelledby="home-tracks"
      className="bg-[#0b1120] py-12 text-white lg:py-16"
    >
      <div className="container mx-auto grid gap-8 px-4 xl:grid-cols-[17rem_minmax(0,1fr)] xl:gap-12">
        <div>
          <h2
            id="home-tracks"
            className="text-2xl font-bold tracking-tight sm:text-3xl"
          >
            Courses by track
          </h2>
          <p className="mt-3 max-w-md leading-relaxed text-slate-300">
            Pick a track, start from any course: the first lesson is free.
          </p>
          <Link
            href="/courses"
            className="mt-5 inline-flex items-center gap-1.5 rounded-sm font-medium text-white underline underline-offset-4 outline-none hover:text-emerald-300 focus-visible:ring-2 focus-visible:ring-white"
          >
            Browse all courses
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <Tabs.Root defaultValue={tracks[0].anchor} className="min-w-0">
          <Tabs.List
            aria-label="Tracks"
            className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1 sm:mx-0 sm:flex-wrap sm:px-0"
          >
            {tracks.map((track) => (
              <Tabs.Trigger
                key={track.anchor}
                value={track.anchor}
                className="shrink-0 rounded-full border border-white/30 px-4 py-2 text-sm font-medium text-slate-100 outline-none transition-colors hover:border-white focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1120] data-[state=active]:border-white data-[state=active]:bg-white data-[state=active]:text-slate-950"
              >
                {track.title}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {tracks.map((track) => (
            <Tabs.Content
              key={track.anchor}
              value={track.anchor}
              forceMount
              className="mt-5 outline-none data-[state=inactive]:hidden focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#0b1120]"
            >
              <p className="text-sm text-slate-300">
                {track.tagline}
                {track.tagline && track.count && " · "}
                {track.count}
                {" · "}
                <Link
                  href={`/courses#${track.anchor}`}
                  className="rounded-sm font-medium text-white underline underline-offset-4 outline-none hover:text-emerald-300 focus-visible:ring-2 focus-visible:ring-white"
                >
                  See the track
                </Link>
              </p>
              <ul className="no-scrollbar -mx-4 mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
                {track.courses.map((course) => (
                  <li key={course.id} className="w-[72%] shrink-0 snap-start sm:w-auto">
                    <CourseCard
                      course={course}
                      compact
                      sizes="(max-width: 640px) 72vw, (max-width: 1024px) 45vw, 240px"
                    />
                  </li>
                ))}
                {track.upcoming.map((course) => (
                  <li key={course.id} className="w-[72%] shrink-0 snap-start sm:w-auto">
                    <ComingSoonCard
                      course={course}
                      standalone
                      className="h-full rounded-2xl bg-card text-card-foreground"
                    />
                  </li>
                ))}
              </ul>
            </Tabs.Content>
          ))}
        </Tabs.Root>
      </div>
    </section>
  );
}
