#!/usr/bin/env node
/**
 * Verify SEO metadata length budgets and sitemap completeness.
 *
 * Guards against the regressions found in the 2026-06-06 web audit:
 *   - <title> length 30–60 chars (incl. the "%s — CopyPasteLearn" brand template)
 *   - meta description length 120–160 chars
 *   - templated blog tag/category pages staying within those budgets for EVERY
 *     tag/category (the budgets are easy to break by adding one post or renaming)
 *   - /shop exposing an og:image
 *   - the policy pages being present in the sitemap
 *
 * Run: node scripts/verify-seo-meta.cjs   (exit code 1 on any violation)
 *
 * NOTE: tag/category copy is replicated from the page templates below. If those
 * templates change, the "template drift" guards fail loudly so this file gets
 * updated in lockstep.
 */
const { loadAllPosts, fs, path, ROOT, COLORS } = require("./_lib.cjs");

const BRAND_SUFFIX = " \u2014 CopyPasteLearn"; // root layout title template: "%s — CopyPasteLearn"
const TITLE_MIN = 30;
const TITLE_MAX = 60;
const DESC_MIN = 120;
const DESC_MAX = 160;

const failures = [];
let checks = 0;

function check(cond, msg) {
  checks++;
  if (!cond) failures.push(msg);
}

/** Character count (em dash and other BMP chars count as 1, matching crawlers). */
function len(s) {
  return [...String(s)].length;
}

function read(relFromAppRoot) {
  return fs.readFileSync(path.join(ROOT, relFromAppRoot), "utf-8");
}

function exists(relFromAppRoot) {
  return fs.existsSync(path.join(ROOT, relFromAppRoot));
}

/** Mirror of taxonomySlug() in src/lib/blog-taxonomy.ts. */
function taxonomySlug(name) {
  return String(name)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleWithinBudget(label, rawTitle) {
  const branded = rawTitle + BRAND_SUFFIX;
  const n = len(branded);
  check(
    n >= TITLE_MIN && n <= TITLE_MAX,
    `${label}: title ${n} chars (want ${TITLE_MIN}-${TITLE_MAX}) :: "${branded}"`
  );
}

function descWithinBudget(label, desc) {
  const n = len(desc);
  check(
    n >= DESC_MIN && n <= DESC_MAX,
    `${label}: description ${n} chars (want ${DESC_MIN}-${DESC_MAX})`
  );
}

const posts = loadAllPosts();

// ---------------------------------------------------------------------------
// 1) Blog post frontmatter descriptions (titles get the brand template at render
//    time, so they are validated implicitly by the tag/category checks below).
// ---------------------------------------------------------------------------
for (const p of posts) {
  descWithinBudget(`blog/${p.slug}`, p.description);
}

// Build tag + category frequency maps the same way blog-taxonomy.ts does.
const tagMap = new Map(); // slug -> { name, count }
for (const p of posts) {
  for (const t of p.tags || []) {
    const slug = taxonomySlug(t);
    if (!slug) continue;
    const e = tagMap.get(slug) || { name: String(t), count: 0 };
    e.count += 1;
    tagMap.set(slug, e);
  }
}
const catMap = new Map();
for (const p of posts) {
  if (!p.category) continue;
  const slug = taxonomySlug(p.category);
  if (!slug) continue;
  const e = catMap.get(slug) || { name: p.category, count: 0 };
  e.count += 1;
  catMap.set(slug, e);
}

// ---------------------------------------------------------------------------
// 2) Template drift guards — keep this script in sync with the page sources.
// ---------------------------------------------------------------------------
const tagSrc = read("src/app/(marketing)/blog/tag/[slug]/page.tsx");
check(
  tagSrc.includes("production-ready patterns for platform engineers."),
  "tag description template changed in page.tsx — update verify-seo-meta.cjs"
);
const catSrc = read("src/app/(marketing)/blog/category/[slug]/page.tsx");
check(
  catSrc.includes("${entry.name} Tutorials & Guides"),
  "category title template changed in page.tsx — update verify-seo-meta.cjs"
);

// ---------------------------------------------------------------------------
// 3) Templated tag pages — every tag must fit the budget.
// ---------------------------------------------------------------------------
for (const { name, count } of tagMap.values()) {
  const noun = count === 1 ? "article" : "articles";
  const desc = `${count} ${name} ${noun} on CopyPasteLearn: hands-on tutorials, copy-paste examples, and production-ready patterns for platform engineers.`;
  descWithinBudget(`tag "${name}"`, desc);
  titleWithinBudget(`tag "${name}"`, `Posts tagged "${name}"`);
}

// ---------------------------------------------------------------------------
// 4) Templated category pages — every category must fit the budget.
// ---------------------------------------------------------------------------
for (const { name, count } of catMap.values()) {
  const noun = count === 1 ? "article" : "articles";
  const desc = `Explore ${count} ${noun} in the ${name} category on CopyPasteLearn \u2014 practical walkthroughs, code samples, and production-ready guides for engineers.`;
  descWithinBudget(`category "${name}"`, desc);
  titleWithinBudget(`category "${name}"`, `${name} Tutorials & Guides`);
}

// ---------------------------------------------------------------------------
// 5) /ai-platform-engineering hand-tuned static metadata.
// ---------------------------------------------------------------------------
{
  const src = read("src/app/(marketing)/ai-platform-engineering/page.tsx");
  const start = src.indexOf("export const metadata");
  const block = src.slice(start, src.indexOf("};", start));
  const titleMatch = block.match(/title:\s*"([^"]+)"/);
  const descMatch = block.match(/description:\s*"([^"]+)"/);
  check(Boolean(titleMatch), "ai-platform-engineering: could not parse metadata title");
  check(Boolean(descMatch), "ai-platform-engineering: could not parse metadata description");
  if (titleMatch) titleWithinBudget("ai-platform-engineering", titleMatch[1]);
  if (descMatch) descWithinBudget("ai-platform-engineering", descMatch[1]);
}

// ---------------------------------------------------------------------------
// 6) /shop must expose an og:image. The site generates OG images via colocated
//    opengraph-image.tsx (next/og), so /shop needs its own generator like every
//    other marketing route.
// ---------------------------------------------------------------------------
{
  const ogPath = "src/app/(marketing)/shop/opengraph-image.tsx";
  check(exists(ogPath), `shop: missing ${ogPath} (no og:image generator)`);
  if (exists(ogPath)) {
    check(
      read(ogPath).includes("ImageResponse"),
      "shop: opengraph-image.tsx does not render an ImageResponse"
    );
  }
}

// ---------------------------------------------------------------------------
// 7) Policy pages present in the sitemap (and the routes actually exist).
// ---------------------------------------------------------------------------
{
  const sitemap = read("src/app/sitemap.ts");
  for (const route of ["/refund-policy", "/digital-delivery-policy"]) {
    check(sitemap.includes(route), `sitemap.ts is missing ${route}`);
    check(
      exists(`src/app/(marketing)${route}/page.tsx`),
      `route page missing for ${route}`
    );
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
const { red, green, bold, reset } = COLORS;
if (failures.length === 0) {
  console.log(`${green}${bold}✓ SEO meta verification passed${reset} (${checks} checks)`);
  process.exit(0);
}
console.error(`${red}${bold}✗ SEO meta verification failed${reset} (${failures.length}/${checks} checks)`);
for (const f of failures) console.error(`  ${red}•${reset} ${f}`);
process.exit(1);
