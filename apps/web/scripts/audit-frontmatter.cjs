#!/usr/bin/env node
// Audit blog frontmatter for SEO anomalies.
// Adapted from ansiblepilot.com/scripts/audit-frontmatter.cjs.
const { loadAllPosts } = require('./_lib.cjs');

const posts = loadAllPosts();
const today = new Date().toISOString().slice(0, 10);
const issues = {
  missDesc: [],
  missDate: [],
  missAuthor: [],
  missCategory: [],
  missTags: [],
  futureDate: [],
  weirdSlug: [],
  duplicateSlug: [],
  veryShortTitle: [],
};

const slugSeen = new Map();
for (const t of posts) {
  if (!t.description) issues.missDesc.push(t.slug);
  if (!t.date) issues.missDate.push(t.slug);
  if (!t.author) issues.missAuthor.push(t.slug);
  if (!t.category) issues.missCategory.push(t.slug);
  if (!t.tags || t.tags.length === 0) issues.missTags.push(t.slug);
  const dateOnly = String(t.date).slice(0, 10);
  if (dateOnly && dateOnly > today) issues.futureDate.push(`${dateOnly}  ${t.slug}`);
  if (!/^[a-z0-9-]+$/.test(t.slug || '')) issues.weirdSlug.push(t.slug);
  if (slugSeen.has(t.slug)) issues.duplicateSlug.push(t.slug);
  else slugSeen.set(t.slug, 1);
  if (t.title && t.title.length < 20) {
    issues.veryShortTitle.push(`${t.title.length}  ${t.slug}  "${t.title}"`);
  }
}

console.log(`frontmatter audit: ${posts.length} posts`);
for (const [k, v] of Object.entries(issues)) {
  console.log(`${k.padEnd(20)} ${v.length}`);
  if (v.length && v.length <= 15) v.forEach((x) => console.log(`  ${x}`));
  else if (v.length) v.slice(0, 10).forEach((x) => console.log(`  ${x}`));
}

const totalCritical = issues.missDesc.length + issues.duplicateSlug.length + issues.weirdSlug.length;
process.exit(totalCritical > 0 ? 1 : 0);
