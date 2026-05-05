#!/usr/bin/env node
// Audit thin-content blog posts. Word count is a crude but useful proxy:
// <300 words is genuinely thin, <200 is very thin.
// Adapted from ansiblepilot.com/scripts/audit-thin-content.cjs.
const { loadAllPosts, wordCountFromBody } = require('./_lib.cjs');

const VERY_THIN = 200;
const THIN = 300;

const results = [];
for (const p of loadAllPosts()) {
  results.push({ file: p.file, slug: p.slug, wc: wordCountFromBody(p.content) });
}
results.sort((a, b) => a.wc - b.wc);

const veryThin = results.filter((r) => r.wc < VERY_THIN);
const thin = results.filter((r) => r.wc >= VERY_THIN && r.wc < THIN);

console.log(`posts scanned: ${results.length}`);
console.log(`very thin (<${VERY_THIN} words): ${veryThin.length}`);
console.log(`thin (${VERY_THIN}-${THIN - 1} words): ${thin.length}`);
console.log(`\n--- bottom 30 by word count ---`);
for (const r of results.slice(0, 30)) console.log(`  ${String(r.wc).padStart(5)}  ${r.file}`);

process.exit(veryThin.length > 0 ? 1 : 0);
