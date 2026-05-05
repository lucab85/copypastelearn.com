// Shared utilities for SEO/audit scripts.
// Adapted from ansiblepilot.com/scripts (article-based) to copypastelearn.com (blog-based).

const fs = require('fs');
const path = require('path');

const matter = (() => {
  try {
    return require('gray-matter');
  } catch {
    console.error('Missing dep gray-matter. Run: pnpm install');
    process.exit(1);
  }
})();

const ROOT = path.resolve(__dirname, '..');
const BLOG_DIR = path.join(ROOT, 'content', 'blog');
const PUBLIC_DIR = path.join(ROOT, 'public');
const REPORTS_DIR = path.join(ROOT, 'reports');
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.copypastelearn.com';
const BLOG_PATH = '/blog/';

function ensureReportsDir() {
  if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

function listBlogFiles() {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => (f.endsWith('.md') || f.endsWith('.mdx')) && !f.startsWith('_'));
}

function loadAllPosts() {
  const files = listBlogFiles();
  const posts = [];
  for (const file of files) {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8');
    const { data, content } = matter(raw);
    if (data.draft) continue;
    const slug = file.replace(/\.mdx?$/, '');
    posts.push({
      file,
      slug,
      title: (data.title || '').trim(),
      description: (data.description || '').trim(),
      date: data.date || '',
      author: data.author || '',
      tags: Array.isArray(data.tags) ? data.tags : [],
      category: data.category || '',
      image: data.image || '',
      content,
    });
  }
  return posts;
}

function wordCountFromBody(body) {
  let b = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#+\s+/gm, '')
    .replace(/[*_`>~|-]+/g, ' ');
  return b.split(/\s+/).filter(Boolean).length;
}

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

module.exports = {
  ROOT,
  BLOG_DIR,
  PUBLIC_DIR,
  REPORTS_DIR,
  SITE_URL,
  BLOG_PATH,
  matter,
  fs,
  path,
  ensureReportsDir,
  listBlogFiles,
  loadAllPosts,
  wordCountFromBody,
  COLORS,
};
