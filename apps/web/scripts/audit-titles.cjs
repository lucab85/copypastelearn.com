#!/usr/bin/env node
// Audit titles: duplicates, too-short, too-long, missing intent.
// Adapted from ansiblepilot.com/scripts/audit-titles.cjs.
const { loadAllPosts } = require('./_lib.cjs');

const posts = loadAllPosts();
const seen = new Map();
for (const t of posts) {
  const k = (t.title || '').trim().toLowerCase();
  if (!seen.has(k)) seen.set(k, []);
  seen.get(k).push(t.slug);
}

console.log(`titles: ${posts.length}`);
console.log(`unique titles: ${seen.size}`);

const dup = [...seen.entries()].filter(([, arr]) => arr.length > 1);
console.log(`\nduplicate titles: ${dup.length}`);
dup.slice(0, 15).forEach(([t, arr]) => console.log(`  (${arr.length}) "${t}"  -> ${arr.join(', ')}`));

const intentRe = /(guide|tutorial|how to|complete|cheat|example|step.?by.?step|reference|fix|solve|troubleshoot|automation|automate|configure|install|deploy|create|build|run|manage|use|enable|setup|set up|review|overview|introduction|comparison|vs\.?\b|why|what|where|when|book|course|lesson|learn|master|getting started)/i;

const tooShort = [];
const noIntent = [];
const tooLong = [];
for (const t of posts) {
  const title = (t.title || '').trim();
  if (!title) continue;
  if (title.length < 25) tooShort.push({ slug: t.slug, title });
  else if (title.length > 70) tooLong.push({ slug: t.slug, title, len: title.length });
  if (!intentRe.test(title) && title.length >= 25) noIntent.push({ slug: t.slug, title });
}

console.log(`\ntoo-short titles (<25 chars): ${tooShort.length}`);
tooShort.slice(0, 30).forEach((x) => console.log(`  ${x.title.length} | ${x.title}  (${x.slug})`));

console.log(`\ntoo-long titles (>70 chars): ${tooLong.length}`);
tooLong.slice(0, 15).forEach((x) => console.log(`  ${x.len} | ${x.title}`));

console.log(`\nno-intent titles: ${noIntent.length}`);
noIntent.slice(0, 20).forEach((x) => console.log(`  | ${x.title}  (${x.slug})`));

process.exit(dup.length > 0 ? 1 : 0);
