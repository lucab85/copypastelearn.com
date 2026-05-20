#!/usr/bin/env node
/**
 * Trim blog post frontmatter `description` fields to <=160 chars.
 * Strategy:
 *  - If <=160 chars: leave untouched.
 *  - Else: cut at the last sentence-ending punctuation (.!?) at index <=159.
 *  - Else: cut at the last space <=157 and append a period.
 * Preserves YAML quoting style of the original line.
 */
const fs = require("fs");
const path = require("path");

const BLOG_DIR = path.join(__dirname, "..", "content", "blog");
const MAX = 160;
const TARGET = 159;

const DANGLING = new Set([
  "a", "an", "the", "and", "or", "but", "with", "without", "to", "of", "for",
  "in", "on", "by", "at", "as", "from", "into", "onto", "via", "using", "use",
  "is", "are", "be", "than", "that", "this", "these", "those", "if", "when",
  "while", "where", "how", "why", "what", "which", "vs", "vs.",
]);

function stripDangling(s) {
  // Strip trailing dangling function words/connectors so the description ends cleanly.
  let prev;
  do {
    prev = s;
    s = s.replace(/[,;:\-\s]+$/u, "");
    const m = s.match(/(?:^|\s)(\S+)$/u);
    if (m && DANGLING.has(m[1].toLowerCase())) {
      s = s.slice(0, s.length - m[1].length);
    }
  } while (s !== prev);
  return s;
}

function trimDescription(desc) {
  if (desc.length <= MAX) return desc;
  const slice = desc.slice(0, TARGET);
  // Prefer a sentence boundary, but only if it leaves us with >=140 chars.
  const sentenceEnd = Math.max(
    slice.lastIndexOf(". "),
    slice.lastIndexOf("! "),
    slice.lastIndexOf("? "),
  );
  if (sentenceEnd >= 140) {
    return slice.slice(0, sentenceEnd + 1);
  }
  // Otherwise cut at the last word boundary <=159 and end with a period.
  const lastSpace = slice.lastIndexOf(" ");
  if (lastSpace >= 130) {
    let head = stripDangling(slice.slice(0, lastSpace));
    if (!/[.!?]$/.test(head)) head += ".";
    return head;
  }
  // Fallback: hard cut at word boundary.
  const anySpace = slice.lastIndexOf(" ");
  let head = stripDangling(slice.slice(0, anySpace > 0 ? anySpace : TARGET - 1));
  if (!/[.!?]$/.test(head)) head += ".";
  return head;
}

function processFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  if (!raw.startsWith("---")) return null;
  const end = raw.indexOf("\n---", 3);
  if (end < 0) return null;
  const fm = raw.slice(0, end);
  const body = raw.slice(end);

  const lines = fm.split("\n");
  let changed = false;
  let oldLen = 0;
  let newLen = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(/^description:\s*(["'])([\s\S]*?)\1\s*$/);
    if (!m) continue;
    const quote = m[1];
    const value = m[2];
    oldLen = value.length;
    if (value.length <= MAX) return null;
    const trimmed = trimDescription(value);
    if (trimmed === value) return null;
    // Avoid embedding the same quote unescaped inside; descriptions never contain quotes here.
    if (trimmed.includes(quote)) {
      throw new Error(`Quote conflict in ${filePath}`);
    }
    lines[i] = `description: ${quote}${trimmed}${quote}`;
    newLen = trimmed.length;
    changed = true;
    break;
  }

  if (!changed) return null;
  const next = lines.join("\n") + body;
  fs.writeFileSync(filePath, next);
  return { oldLen, newLen };
}

function main() {
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));
  let updated = 0;
  for (const f of files) {
    const fp = path.join(BLOG_DIR, f);
    try {
      const res = processFile(fp);
      if (res) {
        updated++;
        console.log(`${f}: ${res.oldLen} -> ${res.newLen}`);
      }
    } catch (err) {
      console.error(`ERROR ${f}: ${err.message}`);
    }
  }
  console.log(`\nUpdated ${updated} files.`);
}

main();
