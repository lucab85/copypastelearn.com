#!/usr/bin/env node
/**
 * Detect blog posts with zero incoming internal links.
 * Counts BOTH:
 *   1. Editorial /blog/<slug> links in other post bodies, AND
 *   2. Programmatic "Related Articles" backlinks rendered by
 *      src/app/(marketing)/blog/[slug]/page.tsx (top-3 by category+tag score)
 *
 * This mirrors runtime so the count reflects actual PageRank flow.
 *
 * Adapted from ansiblepilot.com/scripts/audit-orphan-links.cjs.
 *
 * Flags:
 *   --json            JSON output
 *   --no-related      Skip programmatic related-posts backlinks
 *   --max=<n>         Allowed orphan count before non-zero exit (default 5)
 */
const { loadAllPosts } = require('./_lib.cjs');

const args = process.argv.slice(2);
const wantJson = args.includes('--json');
const includeRelated = !args.includes('--no-related');
const maxArg = args.find((a) => a.startsWith('--max='));
const max = maxArg ? Number(maxArg.split('=')[1]) : 5;

const RELATED_LIMIT = 6; // mirror getRelatedPosts() in page.tsx
const CATEGORY_WEIGHT = 3; // mirror page.tsx scoring

const posts = loadAllPosts();
const incoming = Object.create(null);
for (const p of posts) incoming[p.slug] = 0;

// 1) Editorial markdown links in post bodies.
const linkRe = /\]\(\/blog\/([a-z0-9-]+)(?:#[^)]*)?\)/g;
for (const p of posts) {
  const seen = new Set();
  let m;
  while ((m = linkRe.exec(p.content)) !== null) seen.add(m[1]);
  for (const slug of seen) {
    if (slug !== p.slug && slug in incoming) incoming[slug] += 1;
  }
}

// 2) Programmatic "Related" backlinks (mirror getRelatedPosts in page.tsx).
//    Strategy: relevance picks by score + discovery picks via cyclic rotation
//    over the slug-sorted corpus, which guarantees uniform link distribution.
const RELATED_DISCOVER = 3;
if (includeRelated) {
  const sorted = [...posts].sort((a, b) => a.slug.localeCompare(b.slug));
  const indexOf = new Map(sorted.map((p, i) => [p.slug, i]));

  for (const t of posts) {
    const tagSet = new Set((t.tags || []).map(String));
    const scored = [];
    for (const o of posts) {
      if (o.slug === t.slug) continue;
      let score = 0;
      if (o.category && o.category === t.category) score += CATEGORY_WEIGHT;
      for (const tag of o.tags || []) if (tagSet.has(String(tag))) score += 1;
      if (score > 0) scored.push({ slug: o.slug, score });
    }
    scored.sort((a, b) => b.score - a.score);

    const relevanceCap = RELATED_LIMIT - RELATED_DISCOVER;
    const picks = [];
    const seen = new Set();
    for (const s of scored) {
      if (picks.length >= relevanceCap) break;
      picks.push({ slug: s.slug });
      seen.add(s.slug);
    }

    // Cyclic rotation over slug-sorted corpus.
    const idx = indexOf.get(t.slug);
    if (idx !== undefined) {
      for (let step = 1; step <= sorted.length && picks.length < RELATED_LIMIT; step++) {
        const cand = sorted[(idx + step) % sorted.length];
        if (cand.slug === t.slug || seen.has(cand.slug)) continue;
        picks.push({ slug: cand.slug });
        seen.add(cand.slug);
      }
    }

    // Top up from scored if still short.
    for (const s of scored) {
      if (picks.length >= RELATED_LIMIT) break;
      if (!seen.has(s.slug)) {
        picks.push({ slug: s.slug });
        seen.add(s.slug);
      }
    }

    for (const r of picks) incoming[r.slug] += 1;
  }
}

const orphans = Object.entries(incoming)
  .filter(([, n]) => n === 0)
  .map(([slug]) => slug)
  .sort();

if (wantJson) {
  process.stdout.write(JSON.stringify({ total: posts.length, orphans }, null, 2) + '\n');
} else {
  console.log(`[orphan-audit] ${orphans.length} orphan post(s) of ${posts.length}`);
  console.log(`(includes programmatic Related backlinks: ${includeRelated})`);
  for (const s of orphans) console.log(`  - /blog/${s}`);
}

process.exit(orphans.length > max ? 1 : 0);
