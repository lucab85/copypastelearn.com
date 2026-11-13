"use client";

import { useMemo, useState } from "react";
import { Search, Filter } from "lucide-react";
import type { CourseListItem, UpcomingCourse } from "@copypastelearn/shared";
import { CourseCard } from "@/components/course/course-card";
import { Badge } from "@/components/ui/badge";
import { COURSE_TRACKS } from "@/lib/course-tracks";

interface TrackCatalogProps {
  courses: CourseListItem[];
  upcoming?: UpcomingCourse[];
  /** Search box and difficulty filter (catalog page). Off on the home page. */
  showFilters?: boolean;
}

const difficulties = ["ALL", "BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;

export function TrackCatalog({
  courses,
  upcoming = [],
  showFilters = false,
}: TrackCatalogProps) {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<string>("ALL");

  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matches = (c: { title: string; description: string; difficulty: string }) =>
      (!q ||
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)) &&
      (difficulty === "ALL" || c.difficulty === difficulty);

    return COURSE_TRACKS.map((track) => {
      const inTrack = (t: string | null | undefined) =>
        track.id === "OTHER" ? !t : t === track.id;
      return {
        track,
        courses: courses.filter((c) => inTrack(c.track) && matches(c)),
        upcoming: upcoming.filter((c) => inTrack(c.track) && matches(c)),
      };
    }).filter((g) => g.courses.length > 0 || g.upcoming.length > 0);
  }, [courses, upcoming, search, difficulty]);

  return (
    <div>
      {showFilters && (
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search courses..."
              aria-label="Search courses"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="flex gap-1.5">
              {difficulties.map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    difficulty === d
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {d === "ALL" ? "All" : d.charAt(0) + d.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
          <Search className="mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No courses match your filters
          </p>
          <button
            onClick={() => {
              setSearch("");
              setDifficulty("ALL");
            }}
            className="mt-2 text-sm text-primary underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-16">
          {groups.map(({ track, courses: published, upcoming: soon }) => (
            <section
              key={track.id}
              id={track.anchor}
              aria-label={track.title}
              className="scroll-mt-24"
            >
              <div className="mb-6 border-b pb-4">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h2 className="text-2xl font-bold tracking-tight">
                    {track.title}
                  </h2>
                  <span className="text-sm text-muted-foreground">
                    {published.length > 0 &&
                      `${published.length} ${published.length === 1 ? "course" : "courses"}`}
                    {published.length > 0 && soon.length > 0 && " · "}
                    {soon.length > 0 && `${soon.length} coming soon`}
                  </span>
                </div>
                {track.tagline && (
                  <p className="mt-1 font-medium text-foreground/80">
                    {track.tagline}
                  </p>
                )}
                {track.description && (
                  <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                    {track.description}
                  </p>
                )}
              </div>

              {published.length > 0 && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {published.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              )}

              {soon.length > 0 && (
                <div className={published.length > 0 ? "mt-8" : ""}>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Coming soon
                  </h3>
                  <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {soon.map((course) => (
                      <li
                        key={course.id}
                        className="rounded-lg border border-dashed bg-muted/20 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold leading-snug">
                            {course.title}
                          </p>
                          <Badge variant="outline" className="shrink-0 text-[10px]">
                            {course.difficulty.toLowerCase()}
                          </Badge>
                        </div>
                        <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                          {course.description}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
