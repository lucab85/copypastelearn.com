#!/usr/bin/env node
/**
 * Submit URLs to IndexNow.
 * If no URLs are passed, fetches the live sitemap and submits everything.
 *
 * Usage:
 *   INDEXNOW_KEY=<key> node scripts/submit-indexnow.cjs
 *   INDEXNOW_KEY=<key> node scripts/submit-indexnow.cjs https://www.copypastelearn.com/blog/foo
 *
 * .cjs companion to apps/web/scripts/submit-indexnow.mjs and src/lib/indexnow.ts.
 * Adapted from ansiblepilot.com/scripts/submit-indexnow.cjs.
 */
const { SITE_URL } = require('./_lib.cjs');

async function main() {
  const key = process.env.INDEXNOW_KEY || process.env.INDEXNOW_SECRET;
  if (!key) {
    console.error('Missing INDEXNOW_KEY env var');
    process.exit(1);
  }
  const host = new URL(SITE_URL).host;

  let urls = process.argv.slice(2);
  if (urls.length === 0) {
    console.log(`Fetching ${SITE_URL}/sitemap.xml ...`);
    const res = await fetch(`${SITE_URL}/sitemap.xml`);
    const xml = await res.text();
    urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    console.log(`Found ${urls.length} URLs in sitemap`);
  }
  if (!urls.length) return;

  const body = {
    host,
    key,
    keyLocation: `${SITE_URL}/${key}.txt`,
    urlList: urls,
  };

  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });
  console.log(`IndexNow: HTTP ${res.status}`);
  if (!res.ok && res.status !== 202) {
    console.error(await res.text().catch(() => ''));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
