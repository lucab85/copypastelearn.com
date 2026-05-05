#!/usr/bin/env node
// Audit posts eligible for HowTo schema: how-to/install/configure-style titles
// with ≥3 procedural H2 sections containing code/CLI commands.
// Adapted from ansiblepilot.com/scripts/audit-howto.cjs.
const { loadAllPosts } = require('./_lib.cjs');

const titleRe = /^(how to|install|configure|setup|set up|create|build|deploy|run|automate|enable|disable|use|manage|connect|generate|fix|update|upgrade|remove|delete)\b/i;
const skip = /^(faq|frequently asked questions|conclusion|summary|references|prerequisites|introduction|requirements|overview|table of contents|toc|see also|related|further reading|links|resources|downloads?|video|demo|about|contact|credits|footnotes?)\b/i;
const PROC_RE = /(```|^\s*\$\s|\b(?:sudo|apt|dnf|yum|pip|pip3|brew|git|docker|podman|kubectl|helm|systemctl|curl|wget|cd|mkdir|chmod|chown|export|ssh-keygen|npm|pnpm|yarn|node)\s)/im;

let hits = 0;
let droppedNoProc = 0;
const droppedSamples = [];
const sample = [];
const posts = loadAllPosts();

for (const t of posts) {
  const title = (t.title || '').trim();
  if (!titleRe.test(title)) continue;
  const c = t.content || '';
  const h2matches = [...c.matchAll(/^##\s+(.+)$/gm)];
  if (h2matches.length < 3) continue;
  const indexed = h2matches.map((m) => ({ name: m[1].trim(), index: m.index }));
  const candidates = indexed.filter((h) => !skip.test(h.name));
  if (candidates.length < 3) continue;
  const sorted = indexed.map((h) => h.index).sort((a, b) => a - b);
  let proc = 0;
  for (const cand of candidates) {
    const end = sorted.find((idx) => idx > cand.index) ?? c.length;
    if (PROC_RE.test(c.substring(cand.index, end))) proc++;
    if (proc >= 1) break;
  }
  if (proc < 1) {
    droppedNoProc++;
    if (droppedSamples.length < 15) droppedSamples.push(title);
    continue;
  }
  hits++;
  if (sample.length < 6) sample.push({ title, steps: candidates.length });
}

console.log('howto-eligible:', hits, 'of', posts.length);
console.log('dropped by procedural-evidence gate:', droppedNoProc);
console.log('\n--- dropped (no procedural content) ---');
droppedSamples.forEach((s) => console.log(' -', s));
console.log('\n--- active samples ---');
sample.forEach((s) => console.log(' -', s.title, '|', s.steps, 'steps'));
