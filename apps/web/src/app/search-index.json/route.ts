import { NextResponse } from "next/server";
import { getAllPosts } from "@/lib/blog";
import { COURSE_TRACKS } from "@/lib/course-tracks";
import { difficultyLabel } from "@/lib/home-catalog";
import { shortText, type SearchCourse, type SearchIndex } from "@/lib/search-index";
import { getPublicCourses } from "@/server/queries/public-courses";

/**
 * Search index for the Cmd+K palette: published courses and blog posts
 * (titles, short descriptions, tags; no bodies).
 *
 * It lives outside /api on purpose. The Clerk middleware runs on /api/* and
 * sends a signed-out visitor to /sign-in, so the palette got no index for
 * anyone who was not signed in. Everything here is already public on /courses
 * and /blog. Cached for an hour, like the catalog queries.
 */
export const revalidate = 3600;

export async function GET() {
  const items = getAllPosts().map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    category: p.category,
    tags: p.tags,
  }));

  // PUBLISHED courses only (getPublicCourses): an announced draft has no
  // course page, so it must never be a search result.
  let courses: SearchCourse[] = [];
  try {
    courses = (await getPublicCourses()).map((c) => ({
      slug: c.slug,
      title: c.title,
      description: shortText(c.description),
      track: COURSE_TRACKS.find((t) => t.id === c.track)?.title ?? null,
      level: difficultyLabel(c.difficulty),
    }));
  } catch {
    // Database unreachable: articles stay searchable.
  }

  const index: SearchIndex = { courses, items };
  return NextResponse.json(index, {
    headers: {
      "Cache-Control":
        "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
      "X-Robots-Tag": "noindex",
    },
  });
}
