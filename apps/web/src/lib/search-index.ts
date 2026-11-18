/**
 * The index behind the Cmd+K palette and how it is searched. No Node APIs
 * here: the palette (a client component) and the route that builds the index
 * both import this file.
 */

export interface SearchPost {
  slug: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
}

/** A PUBLISHED course. Drafts, announced or not, are never in the index. */
export interface SearchCourse {
  slug: string;
  title: string;
  /** Shortened for the payload (see shortText). */
  description: string;
  /** Track title ("AI Agents"), or null for a course with no track. */
  track: string | null;
  /** "Beginner", "Intermediate" or "Advanced". */
  level: string;
}

export interface SearchIndex {
  courses: SearchCourse[];
  items: SearchPost[];
}

export interface SearchResult {
  type: "course" | "post" | "tag" | "category";
  href: string;
  title: string;
  subtitle?: string;
  score: number;
}

export const MAX_RESULTS = 12;
/** Courses come first; this many at most, so articles stay in view. */
export const MAX_COURSE_RESULTS = 5;

/** Exact / prefix > word-boundary > substring; rough heuristic. */
export function score(haystack: string, q: string): number {
  if (!q) return 0;
  const h = haystack.toLowerCase();
  const needle = q.toLowerCase();
  if (h === needle) return 1000;
  if (h.startsWith(needle)) return 500;
  const wb = new RegExp(
    `\\b${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`
  ).test(h);
  if (wb) return 200;
  if (h.includes(needle)) return 100;
  return 0;
}

/** Mirror of taxonomySlug() in src/lib/blog-taxonomy.ts (which reads files). */
export function taxonomySlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** First paragraph, cut at a word near `max` characters. */
export function shortText(text: string, max = 160): string {
  const first = text.split(/\n\s*\n/)[0].replace(/\s+/g, " ").trim();
  if (first.length <= max) return first;
  const cut = first.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 30)).trimEnd()}…`;
}

function courseSubtitle(course: SearchCourse): string {
  return [course.track, course.level, course.description]
    .filter(Boolean)
    .join(" · ");
}

function courseResult(course: SearchCourse, total: number): SearchResult {
  return {
    type: "course",
    href: `/courses/${course.slug}`,
    title: course.title,
    subtitle: courseSubtitle(course),
    score: total,
  };
}

/**
 * Results for the palette: matching courses first (best match first), then
 * posts, tags and categories by score. With no query: the first courses of
 * the catalog, then the most recent posts.
 */
export function searchAll(index: SearchIndex, query: string): SearchResult[] {
  const q = query.trim();
  if (!q) {
    const courses = index.courses
      .slice(0, MAX_COURSE_RESULTS)
      .map((c) => courseResult(c, 0));
    const posts = index.items
      .slice(0, MAX_RESULTS - courses.length)
      .map((p) => ({
        type: "post" as const,
        href: `/blog/${p.slug}`,
        title: p.title,
        subtitle: p.category,
        score: 0,
      }));
    return [...courses, ...posts];
  }

  const courses: SearchResult[] = [];
  for (const c of index.courses) {
    const total =
      score(c.title, q) * 3 +
      score(c.description, q) +
      score(c.track ?? "", q) * 2 +
      score(c.level, q) * 2;
    if (total > 0) courses.push(courseResult(c, total));
  }
  courses.sort((a, b) => b.score - a.score);

  const out: SearchResult[] = [];
  const seenTags = new Set<string>();
  const seenCats = new Set<string>();
  for (const p of index.items) {
    const titleScore = score(p.title, q) * 3;
    const descScore = score(p.description, q);
    const tagScore = p.tags.reduce((acc, t) => acc + score(t, q) * 2, 0);
    const total = titleScore + descScore + tagScore;
    if (total > 0) {
      out.push({
        type: "post",
        href: `/blog/${p.slug}`,
        title: p.title,
        subtitle: p.description,
        score: total,
      });
    }
    // Surface matching tags / categories as separate result rows.
    if (!seenCats.has(p.category) && score(p.category, q) > 0) {
      seenCats.add(p.category);
      out.push({
        type: "category",
        href: `/blog/category/${taxonomySlug(p.category)}`,
        title: p.category,
        subtitle: "Category",
        score: 250,
      });
    }
    for (const t of p.tags) {
      if (!seenTags.has(t) && score(t, q) > 0) {
        seenTags.add(t);
        out.push({
          type: "tag",
          href: `/blog/tag/${taxonomySlug(t)}`,
          title: t,
          subtitle: "Tag",
          score: 220,
        });
      }
    }
  }
  out.sort((a, b) => b.score - a.score);

  // Courses first, then the rest; dedupe by href.
  const seen = new Set<string>();
  const results: SearchResult[] = [];
  for (const r of [...courses.slice(0, MAX_COURSE_RESULTS), ...out]) {
    if (seen.has(r.href)) continue;
    seen.add(r.href);
    results.push(r);
    if (results.length >= MAX_RESULTS) break;
  }
  return results;
}
