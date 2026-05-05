#!/usr/bin/env node
/**
 * Generate an RSS 2.0 feed of the 50 most recent blog posts.
 *
 * IMPORTANT: copypastelearn already serves a dynamic feed at /feed.xml via
 * src/app/feed.xml/route.ts. Files in public/ take precedence over routes,
 * so by default we write to a non-shadowing path:
 *   public/rss-static.xml
 *
 * Pass --overwrite to write to public/feed.xml + public/rss.xml (this WILL
 * shadow the dynamic route — use only if you want a static feed).
 *
 * Adapted from ansiblepilot.com/scripts/generate-rss.cjs.
 */
const fs = require('fs');
const path = require('path');
const { loadAllPosts, PUBLIC_DIR, SITE_URL } = require('./_lib.cjs');

const posts = loadAllPosts()
  .filter((p) => p.slug && p.date)
  .slice(0, 50);

function escape(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function pubDate(d) {
  const date = new Date(/T/.test(String(d)) ? d : `${d}T12:00:00Z`);
  if (Number.isNaN(date.valueOf())) return new Date().toUTCString();
  return date.toUTCString();
}

const lastBuild = posts[0] ? pubDate(posts[0].date) : new Date().toUTCString();

const xml =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">\n` +
  `<channel>\n` +
  `  <title>CopyPasteLearn — Hands-on Tech Courses</title>\n` +
  `  <link>${SITE_URL}/</link>\n` +
  `  <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />\n` +
  `  <description>Hands-on courses and tutorials for DevOps, automation, AI, and platform engineering.</description>\n` +
  `  <language>en-US</language>\n` +
  `  <lastBuildDate>${lastBuild}</lastBuildDate>\n` +
  `  <generator>CopyPasteLearn generate-rss.cjs</generator>\n` +
  posts
    .map((t) => {
      const url = `${SITE_URL}/blog/${t.slug}`;
      const cats = (t.tags || [])
        .slice(0, 6)
        .map((c) => `      <category>${escape(c)}</category>`)
        .join('\n');
      return (
        `  <item>\n` +
        `    <title>${escape(t.title)}</title>\n` +
        `    <link>${url}</link>\n` +
        `    <guid isPermaLink="true">${url}</guid>\n` +
        `    <pubDate>${pubDate(t.date)}</pubDate>\n` +
        `    <dc:creator>${escape(t.author || 'Luca Berton')}</dc:creator>\n` +
        (cats ? cats + '\n' : '') +
        `    <description>${escape(t.description || '')}</description>\n` +
        `  </item>`
      );
    })
    .join('\n') +
  `\n</channel>\n</rss>\n`;

if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });
const overwrite = process.argv.includes('--overwrite');
const targets = overwrite ? ['feed.xml', 'rss.xml'] : ['rss-static.xml'];
for (const name of targets) {
  fs.writeFileSync(path.join(PUBLIC_DIR, name), xml);
}
console.log(`[rss] wrote ${posts.length} items to public/${targets.join(', public/')}`);
if (!overwrite) {
  console.log('       (pass --overwrite to write feed.xml + rss.xml — note this shadows the dynamic /feed.xml route)');
}
