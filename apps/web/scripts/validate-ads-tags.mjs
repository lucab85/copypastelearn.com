#!/usr/bin/env node
/**
 * Validate the Google Ads tag on the live site, as a visitor sees it.
 *
 *   1. Before any choice: the cookie banner shows, no ad request leaves the
 *      browser and no ad or analytics cookie is set.
 *   2. After "Reject all": still no ad request.
 *   3. After "Accept all": the site runs gtag('config', AW-…) and Google
 *      Ads requests start.
 *   4. The deployed JavaScript contains the Ads ID and the three labels.
 *   5. One test conversion per label (purchase, sign-up, lead) produces a
 *      Google Ads conversion hit with that label.
 *
 * Every Google Ads / GA4 hit is aborted in the browser, so the run records
 * nothing in Google Ads or Analytics. A hit that could not be aborted fails
 * the run.
 *
 * Usage (cwd = apps/web):
 *   node scripts/validate-ads-tags.mjs
 *   node scripts/validate-ads-tags.mjs --url=https://www.copypastelearn.com/courses --headed
 *   node scripts/validate-ads-tags.mjs --no-conversions
 */
import { chromium } from "@playwright/test";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  }),
);

const PAGE_URL = args.url ?? "https://www.copypastelearn.com/";
const ADS_ID = args.id ?? "AW-16953677355";
const LABELS = {
  purchase: args.purchase ?? "nyujCIzM2bodEKuskpQ_",
  signup: args.signup ?? "1VKjCI_M2bodEKuskpQ_",
  lead: args.lead ?? "UCoKCIDe2bodEKuskpQ_",
};
const ADS_NUM = ADS_ID.replace(/^AW-/, "");

// Requests that belong to an ad platform (Google Ads by account number,
// plus the other pixels the site can load).
const AD_REQUEST =
  new RegExp(`${ADS_NUM}|connect\\.facebook\\.net|facebook\\.com/tr|snap\\.licdn\\.com|px\\.ads\\.linkedin\\.com|redditstatic\\.com|alb\\.reddit\\.com`);
// Measurement hits: these are aborted so the run leaves no data behind.
const HIT =
  /googleadservices\.com|doubleclick\.net\/pagead|google\.[a-z.]+\/(pagead|ccm|rmkt)\/|google-analytics\.com\/(g\/)?collect|analytics\.google\.com\/g\/collect/;
const AD_COOKIE = /^(_gcl|_fbp|_fbc|li_|_rdt|_uet|IDE$|test_cookie$)/;
const ANALYTICS_COOKIE = /^(_ga|_clck|_clsk)/;

let failures = 0;
const ok = (msg) => console.log(`  ✔ ${msg}`);
const fail = (msg) => {
  failures++;
  console.log(`  ✘ ${msg}`);
};
const check = (cond, good, bad) => (cond ? ok(good) : fail(bad));
const short = (u) => (u.length > 110 ? `${u.slice(0, 107)}...` : u);

async function newPage(browser) {
  const context = await browser.newContext();
  const seen = [];
  // Hits that got a response from Google, i.e. were not aborted. The
  // "request" event fires before the route handler, so a hit is judged by
  // how it ended, not by whether the handler ran yet.
  const reached = [];
  const blocked = new Set();
  const scripts = [];
  await context.route(HIT, (route) => route.abort());
  context.on("request", (req) => seen.push(req.url()));
  context.on("requestfailed", (req) => HIT.test(req.url()) && blocked.add(req.url()));
  context.on("requestfinished", (req) => HIT.test(req.url()) && reached.push(req.url()));
  context.on("response", async (res) => {
    const url = res.url();
    if (res.request().resourceType() === "script" && url.includes("/_next/")) {
      scripts.push(res.text().catch(() => ""));
    }
  });
  const page = await context.newPage();
  return { context, page, seen, reached, blocked, scripts };
}

async function settle(page, ms = 3000) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(ms);
}

function banner(page) {
  return page.getByRole("dialog", { name: "Cookies" });
}

async function cookieNames(context) {
  return (await context.cookies()).map((c) => c.name);
}

async function checkNothingReachedGoogle(page, reached, blocked) {
  await page.waitForTimeout(1500); // let in-flight hits finish or fail
  check(
    reached.length === 0,
    `all ${blocked.size} measurement hits were aborted, none reached Google`,
    `hits that reached Google (may have been recorded):\n      ${reached.map(short).join("\n      ")}`,
  );
}

async function main() {
  console.log(`Validating ${PAGE_URL}`);
  console.log(`Google Ads ${ADS_ID}, labels ${Object.values(LABELS).join(", ")}\n`);
  // Playwright's own Chromium when installed, otherwise the local Chrome.
  const headless = !args.headed;
  const browser = await chromium
    .launch({ headless, channel: args.channel })
    .catch(() => chromium.launch({ headless, channel: "chrome" }));

  // 1 + 2: first visit, then "Reject all".
  console.log("1. Before consent");
  {
    const { context, page, seen, reached, blocked } = await newPage(browser);
    await page.goto(PAGE_URL, { waitUntil: "domcontentloaded" });
    await settle(page);
    check(await banner(page).isVisible(), "cookie banner is shown", "cookie banner is not shown");
    const ads = seen.filter((u) => AD_REQUEST.test(u));
    check(ads.length === 0, "no ad requests", `ad requests before consent:\n      ${ads.map(short).join("\n      ")}`);
    const names = await cookieNames(context);
    const bad = names.filter((n) => AD_COOKIE.test(n) || ANALYTICS_COOKIE.test(n));
    check(bad.length === 0, "no ad or analytics cookies", `cookies set before consent: ${bad.join(", ")}`);

    console.log("\n2. After \"Reject all\"");
    const before = seen.length;
    await banner(page).getByRole("button", { name: "Reject all" }).click();
    await settle(page);
    const after = seen.slice(before).filter((u) => AD_REQUEST.test(u));
    check(after.length === 0, "no ad requests", `ad requests after rejecting:\n      ${after.map(short).join("\n      ")}`);
    const consent = (await context.cookies()).find((c) => c.name === "cpl_consent");
    const state = consent ? JSON.parse(decodeURIComponent(consent.value)) : null;
    check(state?.marketing === false && state?.analytics === false, "consent cookie records the rejection", `unexpected consent cookie: ${consent?.value ?? "missing"}`);
    await checkNothingReachedGoogle(page, reached, blocked);
    await context.close();
  }

  // 3 + 4 + 5: fresh visit, "Accept all".
  console.log("\n3. After \"Accept all\"");
  {
    const { context, page, seen, reached, blocked, scripts } = await newPage(browser);
    await page.goto(PAGE_URL, { waitUntil: "domcontentloaded" });
    await settle(page, 1000);
    await banner(page).getByRole("button", { name: "Accept all" }).click();
    await page.waitForRequest((r) => r.url().includes(ADS_NUM), { timeout: 15000 }).catch(() => {});
    await settle(page);

    const configured = await page.evaluate(
      (id) => (window.dataLayer ?? []).some((e) => e && e[0] === "config" && e[1] === id),
      ADS_ID,
    );
    check(configured, `site ran gtag('config', '${ADS_ID}')`, `site did not run gtag('config', '${ADS_ID}'): NEXT_PUBLIC_GOOGLE_ADS_ID missing from the build?`);
    const consent = await page.evaluate(() =>
      (window.dataLayer ?? []).filter((e) => e && e[0] === "consent").map((e) => [e[1], e[2]?.ad_storage]),
    );
    const last = consent.at(-1);
    check(last?.[0] === "update" && last?.[1] === "granted", "Consent Mode updated: ad_storage granted", `Consent Mode not granted: ${JSON.stringify(consent)}`);
    const adsRequests = seen.filter((u) => u.includes(ADS_NUM));
    check(adsRequests.length > 0, `${adsRequests.length} Google Ads request(s), e.g. ${short(adsRequests[0] ?? "")}`, "no Google Ads request after accepting");

    console.log("\n4. Deployed JavaScript");
    const bundle = (await Promise.all(scripts)).join("\n");
    check(bundle.includes(ADS_ID), `bundle contains ${ADS_ID}`, `bundle does not contain ${ADS_ID}`);
    for (const [name, label] of Object.entries(LABELS)) {
      check(bundle.includes(label), `bundle contains the ${name} label`, `bundle does not contain the ${name} label ${label}`);
    }

    if (!args["no-conversions"]) {
      console.log("\n5. Test conversions (blocked, nothing is recorded)");
      for (const [name, label] of Object.entries(LABELS)) {
        const hit = page
          .waitForRequest((r) => r.url().includes(ADS_NUM) && r.url().includes(label), { timeout: 10000 })
          .catch(() => null);
        await page.evaluate(
          ([sendTo, n]) =>
            window.gtag("event", "conversion", {
              send_to: sendTo,
              value: 0,
              currency: "EUR",
              transaction_id: `validator-${n}-${Date.now()}`,
            }),
          [`${ADS_ID}/${label}`, name],
        );
        const req = await hit;
        check(req, `${name}: conversion hit sent to ${new URL(req?.url() ?? "http://x").host}`, `${name}: no conversion hit with label ${label}`);
      }
    }

    console.log("");
    await checkNothingReachedGoogle(page, reached, blocked);
    await context.close();
  }

  await browser.close();
  console.log(failures ? `\n${failures} check(s) failed.` : "\nAll checks passed.");
  process.exit(failures ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
