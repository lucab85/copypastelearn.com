/**
 * One-off script to submit all public pages to IndexNow.
 * Usage: npx tsx scripts/submit-indexnow.ts
 */

const key = process.env.INDEXNOW_KEY || "7ebf88e4a1da0fa968f89aff2f387d3d";
const siteUrl = "https://www.copypastelearn.com";
const host = "www.copypastelearn.com";

const urlList = [
  `${siteUrl}/`,
  `${siteUrl}/courses`,
  `${siteUrl}/pricing`,
  `${siteUrl}/about`,
  `${siteUrl}/contact`,
  `${siteUrl}/privacy`,
  `${siteUrl}/terms`,
  `${siteUrl}/courses/ansible-for-beginners`,
  `${siteUrl}/courses/ansible-for-beginners/lessons/what-is-ansible`,
  `${siteUrl}/courses/ansible-for-beginners/lessons/ansible-installation`,
  `${siteUrl}/courses/ansible-for-beginners/lessons/lab-ansible-installation`,
  `${siteUrl}/courses/ansible-for-beginners/lessons/ansible-ad-hoc-commands`,
  `${siteUrl}/courses/ansible-for-beginners/lessons/lab-ansible-ad-hoc-commands`,
];

async function main() {
  console.log(`Submitting ${urlList.length} URLs to IndexNow...\n`);
  urlList.forEach((u) => console.log(`  ${u}`));
  console.log();

  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host,
      key,
      keyLocation: `${siteUrl}/${key}.txt`,
      urlList,
    }),
  });

  const body = await res.text().catch(() => "");
  console.log(`Response: ${res.status} ${res.statusText}`);
  if (body) console.log(`Body: ${body}`);

  if (res.ok || res.status === 202) {
    console.log("\nSuccessfully submitted to IndexNow!");
  } else {
    console.log("\nSubmission returned unexpected status");
    process.exit(1);
  }
}

main();
