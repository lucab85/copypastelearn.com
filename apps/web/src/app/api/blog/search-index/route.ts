import { NextResponse } from "next/server";
import { getAllPosts } from "@/lib/blog";

/**
 * Slim search index for the Cmd+K palette.
 * Cached at the edge for 1h; doesn't include post bodies — the palette
 * matches against title/description/tags only to keep the payload small.
 */
export const revalidate = 3600;

export function GET() {
  const items = getAllPosts().map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    category: p.category,
    tags: p.tags,
  }));
  return NextResponse.json(
    { items },
    {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}
