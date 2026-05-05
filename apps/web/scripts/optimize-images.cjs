#!/usr/bin/env node
/**
 * Image optimizer.
 * Walks public/blog, public/images, public/courses, generates .webp and .avif
 * variants next to each .jpg/.jpeg/.png. Uses `sharp` (peer dep — install
 * separately: pnpm add -D sharp).
 *
 * Adapted from ansiblepilot.com/scripts/optimize-images.cjs.
 *
 * Usage:
 *   pnpm add -D sharp
 *   node scripts/optimize-images.cjs
 *   node scripts/optimize-images.cjs --force   # re-encode existing variants
 */
const fs = require('fs');
const path = require('path');
const { PUBLIC_DIR } = require('./_lib.cjs');

const FORCE = process.argv.includes('--force');
const INPUT_DIRS = ['blog', 'images', 'courses'];
const INPUT_FORMATS = ['.jpg', '.jpeg', '.png'];
const OUTPUT_FORMATS = ['webp', 'avif'];
const QUALITY = { webp: 85, avif: 80 };

let sharp;
try {
  sharp = require('sharp');
} catch {
  console.error('Missing dependency `sharp`. Install with:');
  console.error('  pnpm add -D sharp');
  process.exit(1);
}

const stats = { processed: 0, skipped: 0, errors: 0, savedBytes: 0 };

function* walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else if (entry.isFile()) yield p;
  }
}

async function processImage(inputPath) {
  const ext = path.extname(inputPath).toLowerCase();
  if (!INPUT_FORMATS.includes(ext)) return;
  const base = inputPath.slice(0, -ext.length);
  const inputSize = fs.statSync(inputPath).size;

  for (const fmt of OUTPUT_FORMATS) {
    const out = `${base}.${fmt}`;
    if (!FORCE && fs.existsSync(out)) {
      stats.skipped++;
      continue;
    }
    try {
      await sharp(inputPath)[fmt]({ quality: QUALITY[fmt] }).toFile(out);
      const outSize = fs.statSync(out).size;
      stats.processed++;
      stats.savedBytes += Math.max(0, inputSize - outSize);
      console.log(`  ${path.relative(PUBLIC_DIR, out).padEnd(60)} ${(outSize / 1024).toFixed(0)}KB`);
    } catch (err) {
      stats.errors++;
      console.error(`  ERROR ${out}: ${err.message}`);
    }
  }
}

(async () => {
  console.log('Optimizing images...');
  for (const sub of INPUT_DIRS) {
    const dir = path.join(PUBLIC_DIR, sub);
    if (!fs.existsSync(dir)) continue;
    console.log(`\nScanning ${dir}/`);
    for (const file of walk(dir)) await processImage(file);
  }
  console.log('\n--- Summary ---');
  console.log(`Processed:    ${stats.processed}`);
  console.log(`Skipped:      ${stats.skipped} (already exist; pass --force to re-encode)`);
  console.log(`Errors:       ${stats.errors}`);
  console.log(`Bytes saved:  ${(stats.savedBytes / 1024 / 1024).toFixed(2)} MB`);
})();
