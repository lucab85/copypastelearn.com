#!/usr/bin/env node
/**
 * Fix two safely-automatable frontmatter issues found by the audits:
 *   1. Missing `author:` — insert with default ("Luca Berton") preserving style.
 *   2. Inconsistent tag case — for each tag (case-insensitive), pick the most
 *      frequently used spelling as canonical and rewrite all variants.
 *
 * Uses a string-level editor that preserves the existing YAML style
 * (flow vs block, quoting) to keep diffs minimal.
 *
 * Default is dry-run. Pass --write to persist.
 */
const fs = require('fs');
const path = require('path');
const { listBlogFiles, BLOG_DIR, loadAllPosts } = require('./_lib.cjs');

const WRITE = process.argv.includes('--write');
const DEFAULT_AUTHOR = process.env.DEFAULT_AUTHOR || 'Luca Berton';

// --- Pass 1: pick canonical tag spelling per lowercase key. ---
const tagCounts = new Map();
for (const p of loadAllPosts()) {
  for (const t of p.tags || []) {
    const s = String(t);
    tagCounts.set(s, (tagCounts.get(s) || 0) + 1);
  }
}
const canonical = new Map();
for (const [spelling, count] of tagCounts) {
  const key = spelling.toLowerCase();
  const cur = canonical.get(key);
  if (!cur || count > tagCounts.get(cur)) canonical.set(key, spelling);
}

const FRONTMATTER_RE = /^(---\r?\n)([\s\S]*?\r?\n)(---\r?\n?)/;
const TAGS_FLOW_RE = /^(tags\s*:\s*)\[([^\]]*)\][^\S\r\n]*$/m;
const TAGS_BLOCK_RE = /^(tags\s*:[^\S\r\n]*)\r?\n((?:[^\S\r\n]+-[^\r\n]*\r?\n?)+)/m;
const HAS_AUTHOR_RE = /^author\s*:/m;

function quoteSimple(s) {
  return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function splitFlow(inner) {
  const parts = [];
  let buf = '';
  let q = null;
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i];
    if (q) {
      buf += c;
      if (c === q && inner[i - 1] !== '\\') q = null;
    } else if (c === '"' || c === "'") {
      buf += c;
      q = c;
    } else if (c === ',') {
      parts.push(buf.trim());
      buf = '';
    } else {
      buf += c;
    }
  }
  if (buf.trim()) parts.push(buf.trim());
  return parts;
}

function applyTags(fmText) {
  const flow = TAGS_FLOW_RE.exec(fmText);
  if (flow) {
    const rawParts = splitFlow(flow[2]);
    const original = rawParts.map((p) => p.replace(/^["'](.*)["']$/, '$1')).filter(Boolean);
    const seen = new Set();
    const remapped = [];
    for (const t of original) {
      const repl = canonical.get(t.toLowerCase()) ?? t;
      if (!seen.has(repl.toLowerCase())) {
        seen.add(repl.toLowerCase());
        remapped.push(repl);
      }
    }
    const noOp =
      remapped.length === original.length &&
      remapped.every((v, i) => v === original[i]);
    if (noOp) return { text: fmText, changed: false };
    const formatted = `tags: [${remapped.map(quoteSimple).join(', ')}]`;
    return { text: fmText.replace(flow[0], formatted), changed: true };
  }

  const block = TAGS_BLOCK_RE.exec(fmText);
  if (block) {
    const items = block[2]
      .split(/\r?\n/)
      .filter((l) => /\S/.test(l))
      .map((l) => {
        const m = l.match(/^(\s+-\s+)(.*)$/);
        if (!m) return null;
        const raw = m[2].trim();
        const stripped = raw.replace(/^["'](.*)["']$/, '$1');
        return { indent: m[1], raw, value: stripped };
      })
      .filter(Boolean);
    if (!items.length) return { text: fmText, changed: false };
    const seen = new Set();
    const out = [];
    let didChange = false;
    for (const it of items) {
      const repl = canonical.get(it.value.toLowerCase()) ?? it.value;
      if (repl !== it.value) didChange = true;
      if (seen.has(repl.toLowerCase())) {
        didChange = true;
        continue;
      }
      seen.add(repl.toLowerCase());
      const wasQuoted = /^["'].*["']$/.test(it.raw);
      out.push(`${it.indent}${wasQuoted ? quoteSimple(repl) : repl}`);
    }
    if (!didChange) return { text: fmText, changed: false };
    const replacement = `${block[1]}\n${out.join('\n')}\n`;
    return { text: fmText.replace(block[0], replacement), changed: true };
  }
  return { text: fmText, changed: false };
}

function applyAuthor(fmText) {
  if (HAS_AUTHOR_RE.test(fmText)) return { text: fmText, changed: false };
  const trimmed = fmText.replace(/\s*$/, '');
  return { text: `${trimmed}\nauthor: "${DEFAULT_AUTHOR}"\n`, changed: true };
}

let changedAuthor = 0;
let changedTags = 0;
let writtenFiles = 0;
const tagDiffs = [];

for (const file of listBlogFiles()) {
  const fullPath = path.join(BLOG_DIR, file);
  const raw = fs.readFileSync(fullPath, 'utf-8');
  const fm = FRONTMATTER_RE.exec(raw);
  if (!fm) continue;
  const [whole, open, body, close] = fm;

  let nextBody = body;
  const tagResult = applyTags(nextBody);
  if (tagResult.changed) {
    nextBody = tagResult.text;
    changedTags++;
    tagDiffs.push(file);
  }
  const authorResult = applyAuthor(nextBody);
  if (authorResult.changed) {
    nextBody = authorResult.text;
    changedAuthor++;
  }

  if (nextBody !== body) {
    const nextRaw = `${open}${nextBody}${close}${raw.slice(whole.length)}`;
    if (WRITE) fs.writeFileSync(fullPath, nextRaw);
    writtenFiles++;
  }
}

console.log(
  `${WRITE ? 'WROTE' : 'DRY-RUN'}: ${writtenFiles} files (author: ${changedAuthor}, tags: ${changedTags})`
);
if (tagDiffs.length) {
  console.log(`\n--- tag normalizations (first 10) ---`);
  tagDiffs.slice(0, 10).forEach((f) => console.log(`  ${f}`));
  if (tagDiffs.length > 10) console.log(`  … and ${tagDiffs.length - 10} more`);
}
if (!WRITE) console.log('\nPass --write to persist.');
