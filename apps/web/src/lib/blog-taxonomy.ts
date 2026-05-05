import { getAllPosts, type BlogPost } from "@/lib/blog";

/**
 * URL-safe slug for a tag or category name. Lossy but stable, and we round-trip
 * via canonical match (case-insensitive) so display names are preserved.
 */
export function taxonomySlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export interface TaxonomyEntry {
  /** Canonical display name (first occurrence wins). */
  name: string;
  /** URL slug. */
  slug: string;
  /** Post count. */
  count: number;
}

/** Build a frequency-sorted list of tags with display names + slugs. */
export function getAllTags(): TaxonomyEntry[] {
  const display = new Map<string, string>(); // slug -> first-seen display name
  const counts = new Map<string, number>(); // slug -> count
  for (const p of getAllPosts()) {
    for (const t of p.tags || []) {
      const slug = taxonomySlug(String(t));
      if (!slug) continue;
      if (!display.has(slug)) display.set(slug, String(t));
      counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([slug, count]) => ({ slug, count, name: display.get(slug) || slug }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** Build a frequency-sorted list of categories. */
export function getAllCategories(): TaxonomyEntry[] {
  const display = new Map<string, string>();
  const counts = new Map<string, number>();
  for (const p of getAllPosts()) {
    if (!p.category) continue;
    const slug = taxonomySlug(p.category);
    if (!slug) continue;
    if (!display.has(slug)) display.set(slug, p.category);
    counts.set(slug, (counts.get(slug) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([slug, count]) => ({ slug, count, name: display.get(slug) || slug }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** Resolve a tag slug back to its canonical entry + matching posts. */
export function getPostsByTag(
  slug: string
): { entry: TaxonomyEntry; posts: BlogPost[] } | null {
  const entry = getAllTags().find((t) => t.slug === slug);
  if (!entry) return null;
  const posts = getAllPosts().filter((p) =>
    (p.tags || []).some((t) => taxonomySlug(String(t)) === slug)
  );
  return { entry, posts };
}

/** Resolve a category slug back to its canonical entry + matching posts. */
export function getPostsByCategory(
  slug: string
): { entry: TaxonomyEntry; posts: BlogPost[] } | null {
  const entry = getAllCategories().find((c) => c.slug === slug);
  if (!entry) return null;
  const posts = getAllPosts().filter(
    (p) => p.category && taxonomySlug(p.category) === slug
  );
  return { entry, posts };
}
