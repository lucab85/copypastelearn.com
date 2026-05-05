#!/usr/bin/env node
/**
 * Audit blog `description` fields and flag SEO issues.
 *   - missing      : no description set
 *   - too-short    : < 80 chars
 *   - too-long     : > 160 chars
 *   - duplicate    : same description used by 2+ posts
 *   - generic      : matches a denylist of placeholder phrasings
 *
 * Run:  node scripts/audit-descriptions.cjs [--json]
 * Adapted from ansiblepilot.com/scripts/audit-descriptions.cjs.
 */
const { loadAllPosts, COLORS } = require('./_lib.cjs');

const MIN_LEN = 80;
const MAX_LEN = 160;
const GENERIC_PATTERNS = [
  /^learn (devops|automation|programming|coding)\.?$/i,
  /^step.?by.?step (guide|tutorial)\.?$/i,
  /^complete guide\.?$/i,
  /^a tutorial\.?$/i,
  /^lorem ipsum/i,
  /^todo$/i,
];

const posts = loadAllPosts();
const dupMap = new Map();
for (const r of posts) {
  if (!r.description) continue;
  const key = r.description.toLowerCase();
  if (!dupMap.has(key)) dupMap.set(key, []);
  dupMap.get(key).push(r.file);
}
const duplicates = new Set();
for (const [, group] of dupMap) {
  if (group.length > 1) for (const f of group) duplicates.add(f);
}

const issues = { missing: [], tooShort: [], tooLong: [], duplicate: [], generic: [] };
for (const r of posts) {
  if (!r.description) {
    issues.missing.push(r.file);
    continue;
  }
  if (r.description.length < MIN_LEN) issues.tooShort.push({ file: r.file, len: r.description.length });
  if (r.description.length > MAX_LEN) issues.tooLong.push({ file: r.file, len: r.description.length });
  if (duplicates.has(r.file)) issues.duplicate.push(r.file);
  if (GENERIC_PATTERNS.some((re) => re.test(r.description))) issues.generic.push(r.file);
}

if (process.argv.includes('--json')) {
  process.stdout.write(JSON.stringify({ total: posts.length, issues }, null, 2));
  process.exit(0);
}

const { reset, bold, red, yellow, green } = COLORS;
console.log(`${bold}Description audit${reset}: ${posts.length} posts`);
console.log(`  missing   : ${issues.missing.length ? red : green}${issues.missing.length}${reset}`);
console.log(`  too short : ${issues.tooShort.length ? yellow : green}${issues.tooShort.length}${reset} (< ${MIN_LEN})`);
console.log(`  too long  : ${issues.tooLong.length ? yellow : green}${issues.tooLong.length}${reset} (> ${MAX_LEN})`);
console.log(`  duplicate : ${issues.duplicate.length ? red : green}${issues.duplicate.length}${reset}`);
console.log(`  generic   : ${issues.generic.length ? yellow : green}${issues.generic.length}${reset}`);

const printList = (label, items, fmt = (x) => x) => {
  if (!items.length) return;
  console.log(`\n${bold}${label}${reset}`);
  for (const item of items.slice(0, 50)) console.log(`  - ${fmt(item)}`);
  if (items.length > 50) console.log(`  … and ${items.length - 50} more`);
};

printList('Missing descriptions', issues.missing);
printList('Too short', issues.tooShort, (x) => `${x.file} (${x.len} chars)`);
printList('Too long', issues.tooLong, (x) => `${x.file} (${x.len} chars)`);
printList('Duplicates', issues.duplicate);
printList('Generic', issues.generic);

const total = issues.missing.length + issues.duplicate.length;
process.exit(total > 0 ? 1 : 0);
