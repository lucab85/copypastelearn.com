#!/usr/bin/env node
/**
 * Broken Link Checker — copypastelearn.com
 *
 * Scans blog markdown files for internal links and verifies they resolve to
 * actual blog slugs or known static routes. Reports broken links with
 * file/line and suggests close matches.
 *
 * Usage:
 *   node scripts/check-broken-links.cjs
 *   node scripts/check-broken-links.cjs --json
 *
 * Adapted from ansiblepilot.com/scripts/check-broken-links.cjs.
 */
const fs = require('fs');
const path = require('path');
const { listBlogFiles, BLOG_DIR, ROOT, PUBLIC_DIR } = require('./_lib.cjs');

const args = process.argv.slice(2);
const JSON_MODE = args.includes('--json');

// Static routes from src/app/(marketing) and src/app/(app). Update if you add new pages.
const VALID_PATHS = new Set([
  '/', '/about', '/contact', '/courses', '/pricing', '/blog',
  '/privacy', '/terms', '/sign-in', '/sign-up',
  '/ai-platform-engineering',
  '/dashboard', '/account', '/learn',
]);

// Redirects parsed from next.config.mjs.
function loadRedirects() {
  const map = new Map();
  try {
    const cfg = fs.readFileSync(path.join(ROOT, 'next.config.mjs'), 'utf8');
    // Match {source: "...", destination: "..."} blocks (simple, no params).
    const re = /source:\s*["']([^"']+)["'][\s\S]*?destination:\s*["']([^"']+)["']/g;
    let m;
    while ((m = re.exec(cfg)) !== null) {
      if (!m[1].includes(':') && !m[1].includes('*')) map.set(m[1], m[2]);
    }
  } catch {}
  return map;
}

function getSlug(filename) {
  return filename.replace(/\.mdx?$/, '');
}

function extractLinks(content, filepath) {
  const links = [];
  const stripped = content
    .replace(/```[\s\S]*?```/g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/`[^`\n]+`/g, (m) => ' '.repeat(m.length));
  const lines = stripped.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const mdLinkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
    let match;
    while ((match = mdLinkRegex.exec(line)) !== null) {
      const url = match[2].split('#')[0].split('?')[0];
      if (
        url &&
        !url.startsWith('http') &&
        !url.startsWith('mailto:') &&
        !url.startsWith('#') &&
        !/\.(jpg|jpeg|png|gif|webp|svg|avif|mp4|webm)$/i.test(url)
      ) {
        links.push({ text: match[1], url, line: i + 1, file: filepath });
      }
    }
    const hrefRegex = /href=["']([^"']+)["']/g;
    while ((match = hrefRegex.exec(line)) !== null) {
      const url = match[1].split('#')[0].split('?')[0];
      if (
        url &&
        !url.startsWith('http') &&
        !url.startsWith('mailto:') &&
        !url.startsWith('#') &&
        !/\.(jpg|jpeg|png|gif|webp|svg|avif|mp4|webm)$/i.test(url)
      ) {
        links.push({ text: '', url, line: i + 1, file: filepath });
      }
    }
  }
  return links;
}

function main() {
  const files = listBlogFiles();
  const validSlugs = new Set();
  const slugMap = new Map();
  for (const file of files) {
    const slug = getSlug(file);
    validSlugs.add(`/blog/${slug}`);
    slugMap.set(slug, file);
  }

  const redirects = loadRedirects();
  const broken = [];
  const warnings = [];
  let totalLinks = 0;

  for (const file of files) {
    const content = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8');
    const links = extractLinks(content, file);
    totalLinks += links.length;

    for (const link of links) {
      const url = link.url.replace(/\/$/, '') || '/';

      if (url.startsWith('/blog/')) {
        const normalized = url;
        if (!validSlugs.has(normalized)) {
          if (redirects.has(normalized)) {
            warnings.push({ ...link, type: 'redirect', target: redirects.get(normalized) });
          } else {
            const linkSlug = normalized.replace('/blog/', '');
            const suggestions = [];
            for (const slug of slugMap.keys()) {
              if (slug.includes(linkSlug) || linkSlug.includes(slug)) {
                suggestions.push(`/blog/${slug}`);
              }
            }
            if (suggestions.length === 0) {
              const linkWords = new Set(linkSlug.split('-').filter((w) => w.length > 3));
              let bestScore = 0;
              let bestSlug = null;
              for (const slug of slugMap.keys()) {
                const slugWords = new Set(slug.split('-').filter((w) => w.length > 3));
                let overlap = 0;
                for (const w of linkWords) if (slugWords.has(w)) overlap++;
                const score = overlap / Math.max(linkWords.size, 1);
                if (score > bestScore && score >= 0.5) {
                  bestScore = score;
                  bestSlug = slug;
                }
              }
              if (bestSlug) suggestions.push(`/blog/${bestSlug}`);
            }
            broken.push({ ...link, type: 'broken', suggestions: suggestions.slice(0, 3) });
          }
        }
      } else if (url.startsWith('/courses/') || url.startsWith('/learn/')) {
        // Courses/lessons live in DB; skip.
      } else if (!VALID_PATHS.has(url)) {
        if (redirects.has(url)) {
          warnings.push({ ...link, type: 'redirect', target: redirects.get(url) });
        } else {
          warnings.push({ ...link, type: 'unknown-path' });
        }
      }
    }
  }

  // Image existence check (public/blog/, public/images/)
  let missingImages = 0;
  const imgRefs = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8');
    const imgRegex = /!\[[^\]]*\]\(\/([^)]+\.(jpg|jpeg|png|gif|webp|svg|avif))\)/gi;
    let m;
    while ((m = imgRegex.exec(content)) !== null) {
      const rel = decodeURIComponent(m[1]);
      const abs = path.join(PUBLIC_DIR, rel);
      if (!fs.existsSync(abs)) {
        missingImages++;
        imgRefs.push({ file, image: '/' + rel });
      }
    }
  }

  if (JSON_MODE) {
    console.log(JSON.stringify({ totalLinks, totalFiles: files.length, broken, warnings, missingImages, imgRefs }, null, 2));
    process.exit(broken.length > 0 ? 1 : 0);
  }

  console.log(`\nBroken Link Checker — copypastelearn.com`);
  console.log('─'.repeat(50));
  console.log(`Files scanned:        ${files.length}`);
  console.log(`Internal links:       ${totalLinks}`);
  console.log(`Broken links:         ${broken.length}`);
  console.log(`Redirect links:       ${warnings.filter((w) => w.type === 'redirect').length}`);
  console.log(`Unknown paths:        ${warnings.filter((w) => w.type === 'unknown-path').length}`);
  console.log(`Missing images:       ${missingImages}`);
  console.log();

  if (broken.length) {
    console.log('BROKEN LINKS');
    console.log('─'.repeat(50));
    for (const b of broken) {
      console.log(`  ${b.file}:${b.line}  ${b.url}`);
      if (b.text) console.log(`    text: "${b.text}"`);
      for (const s of b.suggestions || []) console.log(`    suggest: ${s}`);
    }
    console.log();
  }
  const redirs = warnings.filter((w) => w.type === 'redirect');
  if (redirs.length) {
    console.log('REDIRECT LINKS (consider updating to final URL)');
    console.log('─'.repeat(50));
    for (const w of redirs) console.log(`  ${w.file}:${w.line}  ${w.url} → ${w.target}`);
    console.log();
  }
  if (imgRefs.length) {
    console.log('MISSING IMAGES');
    console.log('─'.repeat(50));
    imgRefs.slice(0, 30).forEach((x) => console.log(`  ${x.file}  ->  ${x.image}`));
  }
  if (!broken.length && !redirs.length && !imgRefs.length) {
    console.log('All internal links and images are valid.');
  }

  process.exit(broken.length > 0 ? 1 : 0);
}

main();
