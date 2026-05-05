#!/usr/bin/env node
// Audit FAQ sections. Flags posts with `## FAQ` heading but <2 valid Q&A pairs
// or thin (<60 char) answers. Useful for FAQ JSON-LD activation.
// Adapted from ansiblepilot.com/scripts/audit-faq.cjs.
const { loadAllPosts } = require('./_lib.cjs');

let totalEmitted = 0;
let totalSkipped = 0;
const tooFewPairs = [];
const thinAnswers = [];
const ALLs = [];

const cleanAnswer = (raw) =>
  raw
    .trim()
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .replace(/\n{2,}/g, ' ')
    .trim();

for (const t of loadAllPosts()) {
  const content = t.content || '';
  const headingMatch = /^##\s+(?:FAQ(?:s)?|Frequently Asked Questions)\s*$/im.exec(content);
  if (!headingMatch) continue;
  const idx = headingMatch.index;
  const rest = content.substring(idx);
  const nextH2 = rest.indexOf('\n## ', 5);
  const faqSection = nextH2 > 0 ? rest.substring(0, nextH2) : rest;
  const pairs = [];

  for (const part of faqSection.split(/^### /m).slice(1)) {
    const lines = part.trim().split('\n');
    const q = (lines[0] || '').trim();
    const a = cleanAnswer(lines.slice(1).join('\n'));
    if (q && a && a.length >= 50) pairs.push({ q, a });
  }
  if (pairs.length === 0) {
    const qRe = /^\*\*Q[.:]\s*([^*]+?)\*\*\s*\n([\s\S]*?)(?=\n\*\*Q[.:]|\n##\s|$)/gm;
    let m;
    while ((m = qRe.exec(faqSection)) !== null) {
      const q = m[1].trim();
      const a = cleanAnswer(m[2]);
      if (q && a && a.length >= 50) pairs.push({ q, a });
    }
  }
  if (pairs.length < 2) {
    totalSkipped++;
    tooFewPairs.push({ slug: t.slug, count: pairs.length });
    continue;
  }
  totalEmitted++;
  for (const p of pairs.slice(0, 10)) {
    ALLs.push({ slug: t.slug, q: p.q, len: p.a.length });
    if (p.a.length < 60) thinAnswers.push({ slug: t.slug, q: p.q, len: p.a.length });
  }
}

ALLs.sort((a, b) => a.len - b.len);
console.log('posts with valid FAQ schema (≥2 pairs):', totalEmitted);
console.log('posts with ## FAQ but <2 valid pairs (skipped):', totalSkipped);
console.log('total Q&A pairs:', ALLs.length);
console.log('thin answers (<60 chars):', thinAnswers.length);
console.log('\n--- thinnest 15 answers ---');
ALLs.slice(0, 15).forEach((x) =>
  console.log(`  ${x.len.toString().padStart(3)} | ${x.slug} | ${x.q}`)
);
if (tooFewPairs.length) {
  console.log('\n--- skipped posts (had ## FAQ but <2 usable pairs) ---');
  tooFewPairs.slice(0, 20).forEach((x) => console.log(`  pairs=${x.count} | ${x.slug}`));
}
