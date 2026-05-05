#!/usr/bin/env node
/**
 * Generate an editorial expansion plan for thin-content posts.
 *
 * For each post under WORD_LIMIT, emit:
 *   - file, slug, current word count, current H2 list
 *   - suggested missing sections (heuristic, NOT auto-applied)
 *
 * Suggestions are picked from a category-aware checklist; we never write
 * prose, only section headings + a one-line hint of what to cover. This
 * gives the editor a consistent skeleton to expand into.
 *
 * Output: reports/thin-content-plan.md (Markdown) + .json (machine-readable)
 *
 * Flags:
 *   --limit=<n>   Word-count cutoff (default 300)
 *   --top=<n>     Process only the N thinnest posts (default: all under limit)
 */
const fs = require('fs');
const path = require('path');
const { loadAllPosts, wordCountFromBody, REPORTS_DIR, ensureReportsDir } = require('./_lib.cjs');

const args = process.argv.slice(2);
const limitArg = args.find((a) => a.startsWith('--limit='));
const topArg = args.find((a) => a.startsWith('--top='));
const WORD_LIMIT = limitArg ? Number(limitArg.split('=')[1]) : 300;
const TOP = topArg ? Number(topArg.split('=')[1]) : Infinity;

// Standard sections expected in each post. Heuristic — based on category.
// Each entry: heading, hint (one-line editorial brief for the writer).
const STANDARD = [
  { h: 'Introduction', hint: '2–3 sentence problem statement and why it matters.' },
  { h: 'Prerequisites', hint: 'Tools, versions, accounts, or knowledge required.' },
  { h: 'How It Works', hint: 'Brief conceptual overview before commands.' },
  { h: 'Step-by-Step Guide', hint: 'Numbered steps with copy-paste commands.' },
  { h: 'Common Pitfalls', hint: 'Frequent errors and how to fix them.' },
  { h: 'Best Practices', hint: 'Production-ready recommendations.' },
  { h: 'Troubleshooting', hint: 'Diagnostic commands and known issues.' },
  { h: 'Real-World Example', hint: 'Concrete scenario showing the technique end-to-end.' },
  { h: 'Performance & Scaling', hint: 'How the approach behaves under load.' },
  { h: 'Security Considerations', hint: 'Auth, secrets, network, supply-chain risks.' },
  { h: 'FAQ', hint: '3–5 common reader questions with concise answers.' },
  { h: 'Conclusion', hint: 'Recap key points and link to the next logical post.' },
];

// Category overrides — emphasise sections that fit the topic best.
const CATEGORY_FOCUS = {
  Security: ['Threat Model', 'Hardening Checklist', 'Detection & Response'],
  DevOps: ['CI/CD Integration', 'Monitoring & Observability'],
  Kubernetes: ['Manifest Example', 'RBAC & Network Policies'],
  Terraform: ['Module Example', 'State Management'],
  Ansible: ['Playbook Example', 'Idempotency Notes'],
  Linux: ['Distro Notes', 'systemd Integration'],
  AI: ['Model & Dataset', 'Cost & Latency'],
};

function extractH2s(content) {
  return Array.from(content.matchAll(/^##\s+(.+)$/gm)).map((m) => m[1].trim());
}

function suggestSections(category, currentH2s) {
  const lc = new Set(currentH2s.map((h) => h.toLowerCase()));
  const focus = CATEGORY_FOCUS[category] || [];
  const checklist = [...focus, ...STANDARD.map((s) => s.h)];
  const seen = new Set();
  const suggestions = [];
  for (const item of checklist) {
    const key = item.toLowerCase();
    if (seen.has(key) || lc.has(key)) continue;
    seen.add(key);
    const std = STANDARD.find((s) => s.h.toLowerCase() === key);
    suggestions.push({ heading: item, hint: std ? std.hint : 'Category-specific section.' });
  }
  return suggestions;
}

ensureReportsDir();
const posts = loadAllPosts();
const thin = posts
  .map((p) => ({ ...p, wc: wordCountFromBody(p.content), h2s: extractH2s(p.content) }))
  .filter((p) => p.wc < WORD_LIMIT)
  .sort((a, b) => a.wc - b.wc)
  .slice(0, TOP);

// Cap how many suggestions we list per post so the report is actionable.
const MAX_SUGGESTIONS = 6;

const json = thin.map((p) => ({
  file: p.file,
  slug: p.slug,
  category: p.category || null,
  wordCount: p.wc,
  currentH2s: p.h2s,
  suggested: suggestSections(p.category, p.h2s).slice(0, MAX_SUGGESTIONS),
}));

const lines = [];
lines.push(`# Thin-content expansion plan`);
lines.push('');
lines.push(`Generated: ${new Date().toISOString()}`);
lines.push(`Posts under ${WORD_LIMIT} words: **${thin.length}** of ${posts.length}`);
lines.push('');
lines.push(`Each post lists its current H2 headings and up to ${MAX_SUGGESTIONS} suggested`);
lines.push(`sections to add. Suggestions are heuristic — pick what fits, ignore the rest.`);
lines.push(`No prose has been generated; the editor writes the content.`);
lines.push('');

for (const p of json) {
  lines.push(`## [${p.wordCount}w] ${p.slug}`);
  lines.push('');
  lines.push(`- **File:** \`content/blog/${path.basename(p.file)}\``);
  lines.push(`- **Category:** ${p.category || '_(none)_'}`);
  if (p.currentH2s.length) {
    lines.push(`- **Current H2s:** ${p.currentH2s.map((h) => '`' + h + '`').join(', ')}`);
  } else {
    lines.push(`- **Current H2s:** _(none — post has no section structure)_`);
  }
  lines.push('');
  lines.push(`**Suggested sections to add:**`);
  lines.push('');
  for (const s of p.suggested) {
    lines.push(`- \`## ${s.heading}\` — ${s.hint}`);
  }
  lines.push('');
}

const mdPath = path.join(REPORTS_DIR, 'thin-content-plan.md');
const jsonPath = path.join(REPORTS_DIR, 'thin-content-plan.json');
fs.writeFileSync(mdPath, lines.join('\n'));
fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2));

console.log(`[thin-plan] wrote ${json.length} entries`);
console.log(`  ${mdPath}`);
console.log(`  ${jsonPath}`);
