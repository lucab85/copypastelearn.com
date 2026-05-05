#!/usr/bin/env node
/**
 * Master SEO audit. Runs all individual auditors and aggregates the issue
 * counts into reports/seo-audit.json + a console summary.
 *
 * Adapted from ansiblepilot.com/scripts/seo-audit.cjs.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { REPORTS_DIR, ensureReportsDir, COLORS } = require('./_lib.cjs');

const SCRIPTS_DIR = __dirname;
const AUDITS = [
  { name: 'frontmatter', script: 'audit-frontmatter.cjs' },
  { name: 'descriptions', script: 'audit-descriptions.cjs' },
  { name: 'titles', script: 'audit-titles.cjs' },
  { name: 'weak-titles', script: 'audit-weak-titles.cjs' },
  { name: 'duplicate-meta', script: 'audit-duplicate-meta.cjs' },
  { name: 'tags', script: 'audit-tags.cjs' },
  { name: 'image-alt', script: 'audit-image-alt.cjs' },
  { name: 'thin-content', script: 'audit-thin-content.cjs' },
  { name: 'faq', script: 'audit-faq.cjs' },
  { name: 'howto', script: 'audit-howto.cjs' },
  { name: 'anchor-diversity', script: 'audit-anchor-diversity.cjs' },
  { name: 'orphan-links', script: 'audit-orphan-links.cjs' },
  { name: 'trailing-slash', script: 'audit-trailing-slash.cjs' },
  { name: 'broken-links', script: 'check-broken-links.cjs' },
  { name: 'redirected-links', script: 'scan-redirected-links.cjs' },
];

ensureReportsDir();
const summary = [];

for (const a of AUDITS) {
  const file = path.join(SCRIPTS_DIR, a.script);
  if (!fs.existsSync(file)) continue;
  console.log(`\n${COLORS.bold}===== ${a.name} =====${COLORS.reset}`);
  try {
    const out = execFileSync(process.execPath, [file], {
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: path.resolve(__dirname, '..'),
    }).toString();
    process.stdout.write(out);
    summary.push({ name: a.name, status: 'pass', tail: out.split('\n').slice(-5).join('\n') });
  } catch (err) {
    const out = (err.stdout || '').toString();
    process.stdout.write(out);
    if (err.stderr) process.stderr.write(err.stderr.toString());
    summary.push({
      name: a.name,
      status: 'fail',
      exitCode: err.status,
      tail: out.split('\n').slice(-5).join('\n'),
    });
  }
}

console.log(`\n${COLORS.bold}===== SUMMARY =====${COLORS.reset}`);
const passed = summary.filter((s) => s.status === 'pass').length;
const failed = summary.filter((s) => s.status === 'fail').length;
console.log(`  pass: ${COLORS.green}${passed}${COLORS.reset}    fail: ${failed ? COLORS.red : COLORS.green}${failed}${COLORS.reset}`);
for (const s of summary) {
  const c = s.status === 'pass' ? COLORS.green : COLORS.red;
  console.log(`  ${c}${s.status.toUpperCase().padEnd(4)}${COLORS.reset}  ${s.name}`);
}

const outPath = path.join(REPORTS_DIR, 'seo-audit.json');
fs.writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), summary }, null, 2));
console.log(`\nReport: ${outPath}`);

process.exit(failed > 0 ? 1 : 0);
