#!/usr/bin/env node
/**
 * Audit live sitemap.xml vs filesystem.
 * Reports:
 *   - URLs in sitemap not backed by a blog file or known route
 *   - Blog files not present in the sitemap
 *   - Non-canonical hosts (http://, non-www, trailing slashes)
 *
 * Usage:
 *   node scripts/audit-sitemap.cjs
 *   node scripts/audit-sitemap.cjs --url=https://www.copypastelearn.com/sitemap.xml
 *
 * Adapted from ansiblepilot.com/scripts/audit-sitemap-vs-filesystem.cjs.
 */
const { listBlogFiles, SITE_URL } = require('./_lib.cjs');

const arg = process.argv.find((a) => a.startsWith('--url='));
const SITEMAP_URL = arg ? arg.split('=')[1] : `${SITE_URL}/sitemap.xml`;
const HOST = new URL(SITE_URL).host;

(async () => {
  let xml;
  try {
    const res = await fetch(SITEMAP_URL);
    if (!res.ok) {
      console.error(`Failed to fetch ${SITEMAP_URL}: HTTP ${res.status}`);
      process.exit(2);
    }
    xml = await res.text();
  } catch (err) {
    console.error(`Failed to fetch ${SITEMAP_URL}: ${err.message}`);
    process.exit(2);
  }

  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  console.log(`Sitemap URLs: ${urls.length} (${SITEMAP_URL})`);

  const issues = { nonHttps: [], wrongHost: [], trailingSlash: [] };
  const blogUrls = new Set();
  for (const u of urls) {
    if (!u.startsWith('https://')) issues.nonHttps.push(u);
    try {
      const parsed = new URL(u);
      if (parsed.host !== HOST) issues.wrongHost.push(u);
      if (parsed.pathname !== '/' && parsed.pathname.endsWith('/')) issues.trailingSlash.push(u);
      const m = /^\/blog\/([^/?#]+)\/?$/.exec(parsed.pathname);
      if (m) blogUrls.add(m[1]);
    } catch {
      issues.wrongHost.push(u);
    }
  }

  const blogSlugs = new Set(listBlogFiles().map((f) => f.replace(/\.mdx?$/, '')));
  const missingFromSitemap = [...blogSlugs].filter((s) => !blogUrls.has(s));
  const sitemapNotOnDisk = [...blogUrls].filter((s) => !blogSlugs.has(s));

  console.log(`\nBlog slugs on disk:   ${blogSlugs.size}`);
  console.log(`Blog slugs in sitemap:${blogUrls.size}`);
  console.log(`Missing from sitemap: ${missingFromSitemap.length}`);
  console.log(`In sitemap, no file:  ${sitemapNotOnDisk.length}`);
  console.log(`Non-https URLs:       ${issues.nonHttps.length}`);
  console.log(`Wrong host URLs:      ${issues.wrongHost.length}`);
  console.log(`Trailing slash URLs:  ${issues.trailingSlash.length}`);

  const print = (label, items) => {
    if (!items.length) return;
    console.log(`\n--- ${label} (first 25) ---`);
    items.slice(0, 25).forEach((x) => console.log(`  ${x}`));
  };
  print('Missing from sitemap', missingFromSitemap);
  print('In sitemap, no file', sitemapNotOnDisk);
  print('Non-https', issues.nonHttps);
  print('Wrong host', issues.wrongHost);
  print('Trailing slash', issues.trailingSlash);

  const totalIssues =
    missingFromSitemap.length +
    sitemapNotOnDisk.length +
    issues.nonHttps.length +
    issues.wrongHost.length +
    issues.trailingSlash.length;
  process.exit(totalIssues > 0 ? 1 : 0);
})();
