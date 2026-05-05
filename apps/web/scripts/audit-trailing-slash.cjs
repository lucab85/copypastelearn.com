#!/usr/bin/env node
/**
 * Audit internal links for trailing-slash consistency.
 *
 * Next.js (with default `trailingSlash: false`) treats `/foo` and `/foo/`
 * as different URLs, with the trailing-slash form 308-redirecting. To avoid
 * needless redirect hops in our own content / nav code, every internal link
 * should be slashless.
 *
 * Scans:
 *   - apps/web/content/blog/**\/*.md   (editorial markdown links)
 *   - apps/web/src/**\/*.{ts,tsx}      (Link href= and string URLs)
 *
 * Exit non-zero on first violation, listing file:line:context for each.
 */
const fs = require('fs');
const path = require('path');
const { ROOT } = require('./_lib.cjs');

const SCAN_DIRS = [
  path.join(ROOT, 'content/blog'),
  path.join(ROOT, 'src'),
];
const FILE_EXT = /\.(md|mdx|ts|tsx|js|jsx|cjs|mjs)$/;

// Files we never flag — robots.ts uses trailing slashes intentionally
// (robots.txt path matching is prefix-based and "/admin/" disallows the
// directory tree, not a single URL).
const SKIP_FILES = new Set([
  path.join('src', 'app', 'robots.ts'),
]);

// Match internal absolute links inside markdown link bodies, JSX attributes,
// and JS strings. We're conservative: only flag paths that look like our own
// routes (start with /blog, /courses, /pricing, /about, /contact, /privacy,
// /terms, /admin, /sign-in, /sign-up, /ai-platform-engineering).
const INTERNAL_PREFIXES = [
  '/blog',
  '/courses',
  '/pricing',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/admin',
  '/sign-in',
  '/sign-up',
  '/ai-platform-engineering',
];

const violations = [];

function* walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'node_modules') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (FILE_EXT.test(e.name)) yield p;
  }
}

// Catch any of:  ](/path/) | href="/path/" | href={`/path/`} | "/path/"
// followed by quote/closing-paren so we don't accidentally match /path/sub.
const RE = /(["'`(])(\/[a-z0-9][a-z0-9/_-]*?\/)(["'`)\s])/gi;

function isInternal(url) {
  return INTERNAL_PREFIXES.some(
    (p) => url === p + '/' || url.startsWith(p + '/')
  );
}

for (const dir of SCAN_DIRS) {
  for (const file of walk(dir)) {
    const rel = path.relative(ROOT, file);
    if (SKIP_FILES.has(rel)) continue;
    const text = fs.readFileSync(file, 'utf8');
    const lines = text.split('\n');
    lines.forEach((line, idx) => {
      let m;
      RE.lastIndex = 0;
      while ((m = RE.exec(line)) !== null) {
        const url = m[2];
        // Strip query/hash before the trailing-slash check.
        if (url.includes('?') || url.includes('#')) continue;
        if (!isInternal(url)) continue;
        violations.push({
          file: rel,
          line: idx + 1,
          url,
          excerpt: line.trim().slice(0, 140),
        });
      }
    });
  }
}

if (violations.length === 0) {
  console.log(`[trailing-slash] no internal trailing-slash links found`);
  process.exit(0);
}

console.log(`[trailing-slash] ${violations.length} violation(s):`);
for (const v of violations) {
  console.log(`  ${v.file}:${v.line}  ${v.url}`);
  console.log(`    ${v.excerpt}`);
}
process.exit(1);
