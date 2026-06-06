#!/usr/bin/env node
/**
 * Guard against re-introducing the low-contrast UI that Lighthouse flagged
 * (accessibility "contrast" audit) in the 2026-06-06 PageSpeed report:
 *   - network footer brand links were text-white/35 (~3:1) and /50 on #0a0a0b
 *   - the ⌘K / "/" kbd hints used text-muted-foreground on bg-muted, which is
 *     only ~4.1:1 in light mode (below the 4.5:1 AA minimum for small text)
 *
 * This is a static string check (same style as verify-seo-meta.cjs) — it does
 * not compute contrast, it just blocks the specific regressions we fixed.
 *
 * Run: node scripts/verify-a11y-contrast.cjs   (exit code 1 on any violation)
 */
const { fs, path, ROOT, COLORS } = require("./_lib.cjs");

const failures = [];
let checks = 0;
function check(cond, msg) {
  checks++;
  if (!cond) failures.push(msg);
}
function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf-8");
}

// 1) Network footer brand links must use readable opacities on the near-black
//    bar. Anything below /60 fails AA for 11px text on #0a0a0b.
{
  const f = "src/components/layout/network-footer.tsx";
  const src = read(f);
  const lowOpacity = src.match(/text-white\/(?:[1-5]\d|[1-9])\b/g) || [];
  check(
    lowOpacity.length === 0,
    `${f}: link text uses low opacity (${[...new Set(lowOpacity)].join(", ")}); use >= text-white/60`
  );
  check(
    src.includes("text-white/70") && src.includes("text-white/60"),
    `${f}: expected active text-white/70 and inactive text-white/60`
  );
}

// 2) kbd hints sit on bg-muted; text-muted-foreground fails AA there in light
//    mode. They must use text-foreground.
for (const f of [
  "src/components/layout/site-header.tsx",
  "src/components/blog/blog-list.tsx",
]) {
  const src = read(f);
  // Find every <kbd ...> opening tag and assert it does not rely on muted text.
  const kbds = src.match(/<kbd[^>]*className="[^"]*"/g) || [];
  check(kbds.length > 0, `${f}: expected at least one <kbd> element`);
  for (const k of kbds) {
    check(
      !/\btext-muted-foreground\b/.test(k),
      `${f}: a <kbd> uses text-muted-foreground on bg-muted (fails AA in light mode) — use text-foreground`
    );
  }
}

const { red, green, bold, reset } = COLORS;
if (failures.length === 0) {
  console.log(`${green}${bold}\u2713 A11y contrast verification passed${reset} (${checks} checks)`);
  process.exit(0);
}
console.error(`${red}${bold}\u2717 A11y contrast verification failed${reset} (${failures.length}/${checks} checks)`);
for (const f of failures) console.error(`  ${red}\u2022${reset} ${f}`);
process.exit(1);
