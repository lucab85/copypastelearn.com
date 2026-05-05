#!/usr/bin/env node
// Anchor-text diversity audit: scan all blog markdown for internal links to
// /blog/<slug> and report (a) anchor monotony — same anchor reused for a
// target — and (b) generic anchors like "click here".
// Adapted from ansiblepilot.com/scripts/audit-anchor-diversity.cjs.
const { loadAllPosts } = require('./_lib.cjs');

const LINK_RE = /\[([^\]\n]{1,200})\]\((?:https?:\/\/(?:www\.)?copypastelearn\.com)?\/blog\/([a-z0-9][a-z0-9-]*?)\/?(?:#[^)]*)?\)/gi;

const bySlug = new Map();
let totalLinks = 0;

for (const p of loadAllPosts()) {
  let m;
  while ((m = LINK_RE.exec(p.content))) {
    totalLinks++;
    const anchor = m[1].trim().replace(/\s+/g, ' ').toLowerCase();
    const slug = m[2].toLowerCase();
    if (!bySlug.has(slug)) bySlug.set(slug, new Map());
    const inner = bySlug.get(slug);
    inner.set(anchor, (inner.get(anchor) || 0) + 1);
  }
}

console.log(`internal /blog/<slug> links scanned: ${totalLinks}`);
console.log(`distinct target slugs: ${bySlug.size}`);

const offenders = [];
for (const [slug, inner] of bySlug.entries()) {
  for (const [anchor, count] of inner.entries()) {
    if (count >= 5) offenders.push({ slug, anchor, count });
  }
}
offenders.sort((a, b) => b.count - a.count);
console.log(`\nanchor-monotony offenders (same anchor reused ≥5x): ${offenders.length}`);
offenders.slice(0, 25).forEach((o) =>
  console.log(`  ${o.count.toString().padStart(4)}x  "${o.anchor}"  ->  /blog/${o.slug}`)
);

const GENERIC = new Set([
  'click here', 'here', 'this article', 'this guide', 'this post',
  'read more', 'learn more', 'more info', 'link', 'this',
]);
const generic = [];
for (const [slug, inner] of bySlug.entries()) {
  for (const [anchor, count] of inner.entries()) {
    if (GENERIC.has(anchor)) generic.push({ slug, anchor, count });
  }
}
console.log(`\ngeneric-anchor instances ("click here", "this guide", …): ${generic.length}`);
generic.slice(0, 15).forEach((o) =>
  console.log(`  ${o.count}x  "${o.anchor}"  ->  /blog/${o.slug}`)
);
