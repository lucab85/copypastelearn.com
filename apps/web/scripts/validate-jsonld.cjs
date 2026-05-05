#!/usr/bin/env node
/**
 * validate-jsonld.cjs
 *
 * Walks the built `.next/` output (or fetches live URLs), extracts every
 *   <script type="application/ld+json">payload</script>
 * block and runs structural / SEO sanity checks:
 *   - JSON parses cleanly
 *   - @context + @type present
 *   - URLs are absolute and on the canonical host
 *   - BreadcrumbList entries each have name + position
 *   - FAQPage Question entries each have non-empty acceptedAnswer.text
 *   - Article/TechArticle has datePublished + headline + image
 *
 * Usage:
 *   node scripts/validate-jsonld.cjs --root=.next
 *   node scripts/validate-jsonld.cjs --url=https://www.copypastelearn.com/blog/some-post
 *
 * Adapted from ansiblepilot.com/scripts/validate-jsonld.cjs.
 */
const fs = require('fs');
const path = require('path');
const { ROOT, SITE_URL } = require('./_lib.cjs');

const args = process.argv.slice(2).reduce((acc, a) => {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/);
  if (m) acc[m[1]] = m[2] === undefined ? true : m[2];
  return acc;
}, {});

const CANONICAL_HOST = SITE_URL;
const MAX_ERRORS = parseInt(args['max-errors'] || '200', 10);
const errors = [];
let pagesScanned = 0;
let blocksScanned = 0;

const SCRIPT_RE =
  /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

function urlOk(u) {
  if (typeof u !== 'string') return true;
  if (!u.startsWith('http')) return true;
  return u.startsWith(CANONICAL_HOST + '/') || u === CANONICAL_HOST;
}
function pushErr(file, msg) {
  if (errors.length < MAX_ERRORS) errors.push(`${file}: ${msg}`);
}
function validateNode(node, file, p = '$') {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach((n, i) => validateNode(n, file, `${p}[${i}]`));
    return;
  }
  if (typeof node['@id'] === 'string' && !urlOk(node['@id']))
    pushErr(file, `${p}.@id non-canonical URL: ${node['@id']}`);
  if (typeof node.mainEntityOfPage === 'string' && !urlOk(node.mainEntityOfPage))
    pushErr(file, `${p}.mainEntityOfPage non-canonical URL: ${node.mainEntityOfPage}`);

  const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
  if (types.includes('BreadcrumbList')) {
    const items = node.itemListElement;
    if (!Array.isArray(items) || !items.length)
      pushErr(file, `${p} BreadcrumbList missing itemListElement`);
    else
      items.forEach((it, i) => {
        if (typeof it.position !== 'number') pushErr(file, `${p}.item[${i}] missing position`);
        if (!it.name) pushErr(file, `${p}.item[${i}] missing name`);
      });
  }
  if (types.includes('FAQPage')) {
    const me = Array.isArray(node.mainEntity) ? node.mainEntity : [];
    if (!me.length) pushErr(file, `${p} FAQPage empty mainEntity`);
    me.forEach((q, i) => {
      if (!q.name) pushErr(file, `${p}.q[${i}] missing name`);
      const ans = q.acceptedAnswer;
      if (!ans || !ans.text || !String(ans.text).trim())
        pushErr(file, `${p}.q[${i}] missing acceptedAnswer.text`);
    });
  }
  if (types.some((t) => t === 'Article' || t === 'TechArticle' || t === 'BlogPosting')) {
    if (!node.headline) pushErr(file, `${p} ${types.join('|')} missing headline`);
    if (!node.datePublished) pushErr(file, `${p} ${types.join('|')} missing datePublished`);
    if (!node.image) pushErr(file, `${p} ${types.join('|')} missing image`);
  }
  for (const v of Object.values(node)) validateNode(v, file, p);
}

function processHtml(file, html) {
  pagesScanned++;
  let m;
  while ((m = SCRIPT_RE.exec(html))) {
    blocksScanned++;
    let json;
    try {
      json = JSON.parse(m[1]);
    } catch (e) {
      pushErr(file, `JSON parse error: ${e.message}`);
      continue;
    }
    const nodes = Array.isArray(json) ? json : [json];
    for (const n of nodes) {
      if (!n['@context']) pushErr(file, '$ missing @context');
      if (!n['@type']) pushErr(file, '$ missing @type');
      validateNode(n, file);
    }
  }
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.isFile() && p.endsWith('.html')) out.push(p);
  }
  return out;
}

async function main() {
  if (args.url) {
    const urls = String(args.url).split(',');
    for (const u of urls) {
      const res = await fetch(u);
      const html = await res.text();
      processHtml(u, html);
    }
  } else {
    const buildRoot = path.resolve(args.root || path.join(ROOT, '.next'));
    if (!fs.existsSync(buildRoot)) {
      console.error(`[validate-jsonld] root not found: ${buildRoot}`);
      console.error('Run `pnpm build` first or pass --url=<live URL>.');
      process.exit(2);
    }
    for (const file of walk(buildRoot)) {
      const html = fs.readFileSync(file, 'utf8');
      processHtml(file, html);
    }
  }

  console.log(`Pages scanned: ${pagesScanned}, JSON-LD blocks: ${blocksScanned}`);
  console.log(`Errors: ${errors.length}`);
  errors.slice(0, MAX_ERRORS).forEach((e) => console.log('  - ' + e));
  process.exit(errors.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
