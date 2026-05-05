#!/usr/bin/env node
/**
 * Generate machine-readable llms files from blog content.
 *
 * Default output (safe — does NOT overwrite the hand-curated public/llms.txt
 * and public/llms-full.txt that ship with the site):
 *   public/llms-blog.txt        compact index of all blog posts
 *   public/llms-blog-full.txt   full content of every blog post
 *
 * Pass --overwrite to clobber public/llms.txt + public/llms-full.txt instead.
 *
 * Adapted from ansiblepilot.com/scripts/generate-llms-full.sh.
 */
const fs = require('fs');
const path = require('path');
const { loadAllPosts, PUBLIC_DIR, SITE_URL } = require('./_lib.cjs');

const overwrite = process.argv.includes('--overwrite');
const indexName = overwrite ? 'llms.txt' : 'llms-blog.txt';
const fullName = overwrite ? 'llms-full.txt' : 'llms-blog-full.txt';

const posts = loadAllPosts();

const indexLines = [
  '# CopyPasteLearn — Blog Index',
  '',
  '> Auto-generated machine-readable index of every blog post on copypastelearn.com.',
  '',
  '## Blog Posts',
  '',
];
for (const p of posts) {
  const title = p.title || p.slug;
  const desc = p.description ? `: ${p.description}` : '';
  indexLines.push(`- [${title}](${SITE_URL}/blog/${p.slug})${desc}`);
}
fs.writeFileSync(path.join(PUBLIC_DIR, indexName), indexLines.join('\n') + '\n');

const fullLines = [
  '# CopyPasteLearn — Blog Full Content',
  '',
  `> Generated ${new Date().toISOString().slice(0, 10)} from ${posts.length} blog posts.`,
  '',
];
for (const p of posts) {
  fullLines.push('');
  fullLines.push('---');
  fullLines.push('');
  fullLines.push(`# ${p.title || p.slug}`);
  fullLines.push(`URL: ${SITE_URL}/blog/${p.slug}`);
  if (p.date) fullLines.push(`Date: ${String(p.date).slice(0, 10)}`);
  if (p.author) fullLines.push(`Author: ${p.author}`);
  if (p.tags && p.tags.length) fullLines.push(`Tags: ${p.tags.join(', ')}`);
  if (p.description) {
    fullLines.push('');
    fullLines.push(`> ${p.description}`);
  }
  fullLines.push('');
  fullLines.push(p.content.trim());
}
fs.writeFileSync(path.join(PUBLIC_DIR, fullName), fullLines.join('\n') + '\n');

console.log(`[llms] wrote public/${indexName} (${posts.length} entries) and public/${fullName}`);
if (!overwrite) console.log('       (pass --overwrite to write to llms.txt / llms-full.txt instead)');
