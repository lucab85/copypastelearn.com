#!/usr/bin/env node
/**
 * Scan blog markdown for internal links that match a redirect rule in
 * next.config.mjs. Such links should be updated to the final URL to avoid
 * unnecessary 301s and preserve link equity.
 *
 * Adapted from ansiblepilot.com/scripts/scan-redirected-links.cjs.
 */
const fs = require('fs');
const path = require('path');
const { loadAllPosts, ROOT } = require('./_lib.cjs');

function loadRedirects() {
  const map = new Map();
  try {
    const cfg = fs.readFileSync(path.join(ROOT, 'next.config.mjs'), 'utf8');
    const re = /source:\s*["']([^"']+)["'][\s\S]*?destination:\s*["']([^"']+)["']/g;
    let m;
    while ((m = re.exec(cfg)) !== null) {
      if (!m[1].includes(':') && !m[1].includes('*')) map.set(m[1], m[2]);
    }
  } catch (err) {
    console.error('Could not parse next.config.mjs:', err.message);
  }
  return map;
}

const redirects = loadRedirects();
console.log(`Loaded ${redirects.size} simple redirect rules from next.config.mjs`);
if (!redirects.size) process.exit(0);

const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
const hrefRegex = /href=["']([^"']+)["']/g;
const issues = [];

for (const p of loadAllPosts()) {
  let m;
  const text = p.content;
  while ((m = linkRegex.exec(text)) !== null) {
    const url = m[2].split('#')[0].split('?')[0];
    if (url.startsWith('/') && redirects.has(url)) {
      issues.push({ slug: p.slug, text: m[1], from: url, to: redirects.get(url) });
    }
  }
  while ((m = hrefRegex.exec(text)) !== null) {
    const url = m[1].split('#')[0].split('?')[0];
    if (url.startsWith('/') && redirects.has(url)) {
      issues.push({ slug: p.slug, text: '(href)', from: url, to: redirects.get(url) });
    }
  }
}

console.log(`\nLinks pointing to redirect sources: ${issues.length}`);
issues.slice(0, 50).forEach((i) =>
  console.log(`  /blog/${i.slug}: "${i.text}" ${i.from} → ${i.to}`)
);

process.exit(issues.length > 0 ? 1 : 0);
