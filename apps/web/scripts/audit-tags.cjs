#!/usr/bin/env node
// Audit tags across blog posts: counts, low-usage (thin), spammy patterns.
// Adapted from ansiblepilot.com/scripts/audit-tags.cjs.
// Note: copypastelearn does not have a dedicated /tags page route,
// so this script is informational — flagging consistency issues.
const { loadAllPosts, REPORTS_DIR, ensureReportsDir, fs, path } = require('./_lib.cjs');

const SPAM_PATTERNS = [
  /^meeting-/i,
  /draft/i,
  /^test$/i,
  /lorem/i,
  /.{60,}/,
];

const posts = loadAllPosts();
const tagCounts = new Map();
const tagPosts = new Map();
const caseVariants = new Map(); // lowercased -> Set of original spellings

for (const p of posts) {
  for (const tag of p.tags || []) {
    const raw = String(tag).trim();
    if (!raw) continue;
    const norm = raw.toLowerCase();
    tagCounts.set(norm, (tagCounts.get(norm) || 0) + 1);
    if (!tagPosts.has(norm)) tagPosts.set(norm, []);
    tagPosts.get(norm).push(p.slug);
    if (!caseVariants.has(norm)) caseVariants.set(norm, new Set());
    caseVariants.get(norm).add(raw);
  }
}

const sorted = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]);
const lowUsage = sorted.filter(([, c]) => c < 3);
const spam = sorted.filter(([t]) => SPAM_PATTERNS.some((re) => re.test(t)));
const inconsistentCase = [...caseVariants.entries()].filter(([, set]) => set.size > 1);

console.log(`Total posts: ${posts.length}`);
console.log(`Unique tags (case-insensitive): ${tagCounts.size}`);
console.log(`Low-usage tags (< 3 posts): ${lowUsage.length}`);
console.log(`Suspected spam tags: ${spam.length}`);
console.log(`Tags with inconsistent case: ${inconsistentCase.length}`);

console.log('\n--- TOP 30 TAGS ---');
sorted.slice(0, 30).forEach(([t, c]) => console.log(`  ${String(c).padStart(4)}  ${t}`));

if (inconsistentCase.length) {
  console.log('\n--- INCONSISTENT CASE (first 20) ---');
  inconsistentCase.slice(0, 20).forEach(([k, set]) => console.log(`  ${k}: ${[...set].join(' | ')}`));
}

if (lowUsage.length) {
  console.log(`\n--- LOW-USAGE TAGS (< 3 posts, top 30) ---`);
  lowUsage.slice(0, 30).forEach(([t, c]) => console.log(`  ${c}  ${t}`));
}

if (spam.length) {
  console.log('\n--- SPAM CANDIDATES ---');
  spam.forEach(([t, c]) => console.log(`  ${c}  ${t}`));
}

ensureReportsDir();
const reportPath = path.join(REPORTS_DIR, 'tag-audit.json');
fs.writeFileSync(reportPath, JSON.stringify({
  total: posts.length,
  uniqueTags: tagCounts.size,
  tagCounts: Object.fromEntries(sorted),
  lowUsage: Object.fromEntries(lowUsage),
  spam: Object.fromEntries(spam),
  inconsistentCase: Object.fromEntries(
    inconsistentCase.map(([k, set]) => [k, [...set]])
  ),
}, null, 2));
console.log(`\nReport: ${reportPath}`);
