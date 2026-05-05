#!/usr/bin/env node
// Audit alt-text on images across blog markdown.
// Adapted from ansiblepilot.com/scripts/audit-image-alt.cjs.
const { loadAllPosts } = require('./_lib.cjs');

const IMG = /!\[([^\]]*)\]\(([^)]+)\)/g;
const GENERIC = /^(image|img|screenshot|picture|photo|untitled|placeholder|figure|fig|graphic|icon|logo|banner|thumbnail|alt text|alt|tbd|todo)\.?$/i;

let total = 0;
const empty = [];
const generic = [];
const tooShort = [];
const ok = [];

for (const p of loadAllPosts()) {
  let m;
  while ((m = IMG.exec(p.content))) {
    total++;
    const alt = m[1].trim();
    const url = m[2].trim();
    if (alt.length === 0) empty.push({ file: p.file, url });
    else if (GENERIC.test(alt)) generic.push({ file: p.file, alt, url });
    else if (alt.length < 8) tooShort.push({ file: p.file, alt, url });
    else ok.push({ file: p.file, alt, url });
  }
}

console.log(`images scanned: ${total}`);
console.log(`empty alt:   ${empty.length}`);
console.log(`generic alt: ${generic.length}`);
console.log(`too short:   ${tooShort.length} (< 8 chars)`);
console.log(`ok:          ${ok.length}`);

console.log('\n--- empty alt (first 15) ---');
empty.slice(0, 15).forEach((x) => console.log(`  ${x.file}  ->  ${x.url}`));
console.log('\n--- generic alt (first 15) ---');
generic.slice(0, 15).forEach((x) => console.log(`  "${x.alt}"  ${x.file}  ->  ${x.url}`));
console.log('\n--- too short (first 10) ---');
tooShort.slice(0, 10).forEach((x) => console.log(`  "${x.alt}"  ${x.file}`));

process.exit(empty.length + generic.length > 0 ? 1 : 0);
