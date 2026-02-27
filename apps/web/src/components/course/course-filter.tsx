"use client";

import { useState, useMemo } from "react";
import { CourseCard } from "@/components/course/course-card";
import { Search, Filter } from "lucide-react";
import type { CourseListItem } from "@copypastelearn/shared";

interface CourseFilterProps {
  courses: CourseListItem[];
}

const difficulties = ["ALL", "BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;

export function CourseFilter({ courses }: CourseFilterProps) {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<string>("ALL");

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const matchesSearch =
        !search ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase());
      const matchesDifficulty =
        difficulty === "ALL" || c.difficulty === difficulty;
      return matchesSearch && matchesDifficulty;
    });
  }, [courses, search, difficulty]);

  return (
    <div>
      {/* Filters */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary"
          />
        </div>

        {/* Difficulty filter */}
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

      {/* Results count */}
      <p className="mb-4 text-sm text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? "course" : "courses"} found
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
