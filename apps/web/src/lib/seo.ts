import type { Metadata } from "next";

/** Brand suffix appended by the root layout's `%s — CopyPasteLearn` title template. */
export const BRAND_SUFFIX = " — CopyPasteLearn";
export const TITLE_MAX = 60;
export const DESC_MIN = 120;
export const DESC_MAX = 155;

/**
 * Page title that stays within TITLE_MAX characters. When appending the brand
 * suffix would push it over budget, emit an absolute title (no suffix) instead
 * of truncating the page's own words.
 */
export function brandedTitle(title: string): NonNullable<Metadata["title"]> {
  return [...(title + BRAND_SUFFIX)].length <= TITLE_MAX
    ? title
    : { absolute: title };
}

/**
 * Pick the first candidate description that fits DESC_MIN–DESC_MAX; otherwise
 * the longest one that is still within DESC_MAX; otherwise the shortest one.
 */
export function pickDescription(candidates: string[]): string {
  const len = (s: string) => [...s].length;
  const inRange = candidates.find((c) => len(c) >= DESC_MIN && len(c) <= DESC_MAX);
  if (inRange) return inRange;
  const fitting = candidates
    .filter((c) => len(c) <= DESC_MAX)
    .sort((a, b) => len(b) - len(a));
  if (fitting.length) return fitting[0];
  return [...candidates].sort((a, b) => len(a) - len(b))[0];
}
