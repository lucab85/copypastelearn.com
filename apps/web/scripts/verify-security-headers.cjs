#!/usr/bin/env node
/**
 * Verify the security response headers declared in next.config.mjs.
 *
 * Guards against the security findings in the 2026-06-06 web audit and prevents
 * regressions (e.g. accidentally dropping a CSP directive or a required
 * third-party origin while editing the long CSP string).
 *
 * Run: node scripts/verify-security-headers.cjs   (exit code 1 on any violation)
 *
 * NOTE on script-src: 'unsafe-inline' and 'unsafe-eval' are still present on
 * purpose. Removing them needs a per-request nonce (Next.js injects inline
 * hydration scripts), which forces dynamic rendering and breaks the static/edge
 * caching this site relies on. That migration is tracked separately; this script
 * asserts the *other* hardening directives stay in place.
 */
const { fs, path, ROOT, COLORS } = require("./_lib.cjs");

const CONFIG = path.join(ROOT, "next.config.mjs");
const src = fs.readFileSync(CONFIG, "utf-8");

const failures = [];
let checks = 0;
function check(cond, msg) {
  checks++;
  if (!cond) failures.push(msg);
}

// Extract the Content-Security-Policy value string.
const cspMatch = src.match(/key:\s*"Content-Security-Policy",\s*value:\s*\n?\s*"([^"]+)"/);
check(Boolean(cspMatch), "Content-Security-Policy header not found in next.config.mjs");

if (cspMatch) {
  const csp = cspMatch[1];
  const directives = new Map(
    csp
      .split(";")
      .map((d) => d.trim())
      .filter(Boolean)
      .map((d) => {
        const [name, ...sources] = d.split(/\s+/);
        return [name, sources];
      })
  );

  // Required directives that harden the policy with no rendering/breakage risk.
  const requireExact = {
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "frame-ancestors": ["'none'"],
    "form-action": ["'self'"],
    "default-src": ["'self'"],
  };
  for (const [name, expected] of Object.entries(requireExact)) {
    const got = directives.get(name);
    check(Boolean(got), `CSP missing directive: ${name}`);
    if (got) {
      check(
        expected.every((s) => got.includes(s)),
        `CSP ${name} should include ${expected.join(" ")} (got: ${got.join(" ") || "<empty>"})`
      );
    }
  }

  // upgrade-insecure-requests is a valueless directive.
  check(
    directives.has("upgrade-insecure-requests"),
    "CSP missing directive: upgrade-insecure-requests"
  );

  // No bare wildcard source on the sensitive fetch directives.
  for (const name of ["default-src", "script-src", "connect-src", "frame-src"]) {
    const got = directives.get(name) || [];
    check(!got.includes("*"), `CSP ${name} must not use a bare '*' wildcard source`);
  }

  // Required third-party origins must remain present (dropping them breaks
  // auth / analytics / video / payments). Guard against accidental removal.
  const mustAllow = [
    "https://*.clerk.com",
    "https://www.googletagmanager.com",
    "https://*.clarity.ms",
    "https://js.stripe.com",
    "https://*.mux.com",
  ];
  for (const origin of mustAllow) {
    check(csp.includes(origin), `CSP no longer allows required origin: ${origin}`);
  }

  // The AI-platform promo video is a youtube-nocookie iframe, so frame-src must
  // permit it (omitting it makes YouTube show "content is blocked").
  check(
    (directives.get("frame-src") || []).includes("https://www.youtube-nocookie.com"),
    "CSP frame-src must allow https://www.youtube-nocookie.com (promo video embed)"
  );
}

// Other security headers that must stay set.
const requiredHeaders = [
  ["X-Frame-Options", 'value: "DENY"'],
  ["X-Content-Type-Options", 'value: "nosniff"'],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
  ["Strict-Transport-Security", "max-age=63072000"],
  ["Permissions-Policy", "camera=()"],
  ["Cross-Origin-Opener-Policy", "same-origin-allow-popups"],
];
for (const [name, needle] of requiredHeaders) {
  check(
    src.includes(`key: "${name}"`),
    `Security header missing from next.config.mjs: ${name}`
  );
  check(src.includes(needle), `Security header ${name} has unexpected value (expected to contain: ${needle})`);
}

const { red, green, bold, reset } = COLORS;
if (failures.length === 0) {
  console.log(`${green}${bold}\u2713 Security headers verification passed${reset} (${checks} checks)`);
  process.exit(0);
}
console.error(`${red}${bold}\u2717 Security headers verification failed${reset} (${failures.length}/${checks} checks)`);
for (const f of failures) console.error(`  ${red}\u2022${reset} ${f}`);
process.exit(1);
