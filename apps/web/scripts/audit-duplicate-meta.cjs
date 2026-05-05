#!/usr/bin/env node
// Audit duplicate titles and descriptions across blog posts.
// Adapted from ansiblepilot.com/scripts/audit-duplicate-titles.cjs +
// audit-duplicate-meta.cjs (merged into one).
const { loadAllPosts } = require('./_lib.cjs');

const posts = loadAllPosts();
const titles = new Map();
const descs = new Map();
for (const a of posts) {
  const t = (a.title || '').trim().toLowerCase();
  const d = (a.description || '').trim().toLowerCase();
  if (t) {
    if (!titles.has(t)) titles.set(t, []);
    titles.get(t).push(a.slug);
  }
  if (d) {
    if (!descs.has(d)) descs.set(d, []);
    descs.get(d).push(a.slug);
  }
}
const dupT = [...titles.entries()].filter(([, v]) => v.length > 1);
const dupD = [...descs.entries()].filter(([, v]) => v.length > 1);
const noDesc = posts.filter((a) => !a.description);
const noTitle = posts.filter((a) => !a.title);
const shortDesc = posts.filter((a) => a.description && a.description.length > 0 && a.description.length < 70);
const longDesc = posts.filter((a) => a.description && a.description.length > 180);

console.log('Total posts:', posts.length);
console.log('Duplicate titles (groups):', dupT.length);
console.log('Duplicate descriptions (groups):', dupD.length);
console.log('Empty description:', noDesc.length);
console.log('Empty title:', noTitle.length);
console.log('Description < 70 chars:', shortDesc.length);
console.log('Description > 180 chars:', longDesc.length);
console.log();

if (dupT.length) {
  console.log('--- DUPLICATE TITLES (top 20) ---');
  dupT.slice(0, 20).forEach(([t, slugs]) => {
    console.log(`[${slugs.length}] ${t.slice(0, 90)}`);
    slugs.slice(0, 5).forEach((s) => console.log(`    - ${s}`));
  });
  console.log();
}
if (dupD.length) {
  console.log('--- DUPLICATE DESCRIPTIONS (top 20) ---');
  dupD.slice(0, 20).forEach(([d, slugs]) => {
    console.log(`[${slugs.length}] ${d.slice(0, 90)}`);
    slugs.slice(0, 5).forEach((s) => console.log(`    - ${s}`));
  });
}

process.exit(dupT.length + dupD.length > 0 ? 1 : 0);
