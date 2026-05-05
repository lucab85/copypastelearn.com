#!/usr/bin/env node
// Reports blog titles likely weak (very short, missing intent words).
// Adapted from ansiblepilot.com/scripts/audit-weak-titles.cjs.
const { loadAllPosts } = require('./_lib.cjs');

const posts = loadAllPosts();
const weak = [];
for (const t of posts) {
  const title = t.title;
  if (!title) continue;
  const words = title.split(/\s+/).length;
  const lacksYear = !/20\d{2}/.test(title);
  const lacksIntent = !/(guide|tutorial|how to|complete|cheat|example|step.?by.?step|quick start|reference|fix|solve|troubleshoot|learn|master|introduction)/i.test(title);
  if (words <= 6 && (lacksYear || lacksIntent)) weak.push([t.file, title, words]);
}
weak.sort((a, b) => a[2] - b[2]);
console.log('weak titles:', weak.length);
weak.slice(0, 50).forEach(([f, t, w]) => console.log(w, '|', t, ' <-', f));
