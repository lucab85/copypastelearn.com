#!/usr/bin/env node
/**
 * Verify that indexable pages are never accidentally served `noindex`.
 *
 * Guards against the regression found in the 2026-06-15 crawl
 * (reports/copypastelearn_15-jun-2026_noindex-page_*.csv): every course lesson
 * page was emitting `robots: noindex` because `generateMetadata` resolved its
 * indexability from the *access-gated* lesson query. Unauthenticated crawlers
 * (Googlebot) hit the paywall branch and got `noindex`, so no lesson page could
 * rank.
 *
 * The fix: lesson indexability must come from whether the lesson EXISTS, not
 * from whether the current request can access it. A lesson page is only
 * `noindex` when the lesson is genuinely missing.
 *
 * This is a static source check (same style as verify-seo-meta.cjs) — it does
 * not run the app. If the lesson metadata logic drifts back toward gating
 * indexability on access, these guards fail loudly.
 *
 * Run: node scripts/verify-noindex.cjs   (exit code 1 on any violation)
 */
const { fs, path, ROOT, COLORS } = require("./_lib.cjs");

const failures = [];
let checks = 0;
function check(cond, msg) {
  checks++;
  if (!cond) failures.push(msg);
}

function read(relFromAppRoot) {
  return fs.readFileSync(path.join(ROOT, relFromAppRoot), "utf-8");
}

// ---------------------------------------------------------------------------
// Pages that MUST stay indexable for valid (existing) URLs. We assert that the
// `generateMetadata` of each one resolves indexability from existence, never
// from the access-gated query, and exposes `index: true` on the success path.
// ---------------------------------------------------------------------------
const LESSON_PAGE = "src/app/(app)/courses/[slug]/lessons/[lessonSlug]/page.tsx";

{
  const src = read(LESSON_PAGE);

  // Isolate the generateMetadata block so the page-body try/catch (which legitimately
  // handles 403/404 rendering) doesn't pollute the check.
  const start = src.indexOf("export async function generateMetadata");
  const end = src.indexOf("export default async function", start);
  check(
    start !== -1 && end !== -1,
    `${LESSON_PAGE}: could not locate generateMetadata block`
  );
  const meta = start !== -1 ? src.slice(start, end === -1 ? undefined : end) : "";

  // Indexability must be derived from an existence/public-metadata lookup, NOT
  // from the gated getLesson()/loadLesson() that throws for unauthenticated crawlers.
  check(
    /getLessonPublicMeta\s*\(/.test(meta),
    `${LESSON_PAGE}: generateMetadata must use getLessonPublicMeta() (ungated existence check) to decide indexability`
  );
  check(
    !/\bloadLesson\s*\(/.test(meta) && !/\bgetLesson\s*\(/.test(meta),
    `${LESSON_PAGE}: generateMetadata must NOT call the access-gated loadLesson()/getLesson() — paywalled lessons would be served noindex to crawlers`
  );

  // The success path must explicitly opt the existing lesson into indexing.
  check(
    /robots:\s*{\s*index:\s*true,\s*follow:\s*true\s*}/.test(meta),
    `${LESSON_PAGE}: generateMetadata must emit robots { index: true, follow: true } for existing lessons`
  );

  // The old paywall bug shipped `index: false, follow: true` for *existing* but
  // locked lessons. `noindex` is only acceptable when the lesson is missing,
  // which we pair with `follow: false`. Disallow the regression pattern.
  check(
    !/index:\s*false,\s*follow:\s*true/.test(meta),
    `${LESSON_PAGE}: generateMetadata must not emit "index: false, follow: true" — that was the paywall regression that hid existing lessons from Google`
  );
}

// ---------------------------------------------------------------------------
// The ungated public-metadata query must exist and must NOT apply gating.
// ---------------------------------------------------------------------------
{
  const LESSON_QUERY = "src/server/queries/lessons.ts";
  const src = read(LESSON_QUERY);

  check(
    /export\s+async\s+function\s+getLessonPublicMeta\s*\(/.test(src),
    `${LESSON_QUERY}: missing getLessonPublicMeta() — the ungated existence/title lookup used by lesson generateMetadata`
  );

  const start = src.indexOf("export async function getLessonPublicMeta");
  // Stop at the next top-level declaration OR its preceding JSDoc, whichever
  // comes first, so a neighbouring function's comments don't leak into the slice.
  const after = start + 1;
  const candidates = [
    src.indexOf("\n/**", after),
    src.indexOf("\nexport ", after),
  ].filter((i) => i !== -1);
  const fnEnd = candidates.length ? Math.min(...candidates) : -1;
  const fn = start !== -1 ? src.slice(start, fnEnd === -1 ? undefined : fnEnd) : "";

  // It must not gate on auth/subscription, otherwise it reintroduces the bug.
  check(
    !/getCurrentUser\s*\(/.test(fn) && !/subscription/i.test(fn) && !/ForbiddenError/.test(fn),
    `${LESSON_QUERY}: getLessonPublicMeta() must not apply auth/subscription gating — it only resolves whether a published lesson exists`
  );

  // It must still scope to PUBLISHED content so drafts stay out of the index.
  check(
    /status:\s*"PUBLISHED"/.test(fn),
    `${LESSON_QUERY}: getLessonPublicMeta() must only resolve PUBLISHED lessons in PUBLISHED courses`
  );
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
const { red, green, bold, reset } = COLORS;
if (failures.length === 0) {
  console.log(`${green}${bold}✓ noindex verification passed${reset} (${checks} checks)`);
  process.exit(0);
}
console.error(`${red}${bold}✗ noindex verification failed${reset} (${failures.length}/${checks} checks)`);
for (const f of failures) console.error(`  ${red}•${reset} ${f}`);
process.exit(1);
