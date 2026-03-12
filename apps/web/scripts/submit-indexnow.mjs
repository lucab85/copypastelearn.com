#!/usr/bin/env node

/**
 * Submit all sitemap URLs to IndexNow.
 *
 * Usage:
 *   INDEXNOW_SECRET=<secret> node scripts/submit-indexnow.mjs
 *   INDEXNOW_SECRET=<secret> node scripts/submit-indexnow.mjs /blog/my-new-post /blog/another
 */

const HOST = "https://www.copypastelearn.com";
const API = `${HOST}/api/indexnow`;

async function main() {
  const secret = process.env.INDEXNOW_SECRET;
  if (!secret) {
    console.error("Missing INDEXNOW_SECRET env var");
    process.exit(1);
  }

  let urls = process.argv.slice(2);

  if (urls.length === 0) {
    // Fetch all URLs from sitemap
    console.log("Fetching sitemap...");
    const res = await fetch(`${HOST}/sitemap.xml`);
    const xml = await res.text();
    urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    console.log(`Found ${urls.length} URLs in sitemap`);
  }

  if (urls.length === 0) {
    console.log("No URLs to submit");
    return;
  }

  console.log(`Submitting ${urls.length} URLs to IndexNow...`);

  const res = await fetch(API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({ urls }),
  });

  const data = await res.json();
  console.log("Response:", JSON.stringify(data, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
