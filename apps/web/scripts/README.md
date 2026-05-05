# SEO & Content Optimization Scripts

Adapted from [ansiblepilot.com/scripts](https://github.com/lucab85/ansiblepilot.com/tree/main/scripts) for the copypastelearn.com Next.js architecture (blog posts in `apps/web/content/blog/*.md` with `gray-matter` frontmatter).

All scripts assume `cwd = apps/web`. Run via `pnpm` (each has an npm-script alias):

| Command | What it does |
|---|---|
| `pnpm seo:audit` | Run **all** auditors and write `reports/seo-audit.json`. Master entry point. |
| `pnpm seo:fix-frontmatter` | Auto-fix safe frontmatter issues: insert missing `author`, normalize tag case, dedupe. Dry-run by default — pass `--write` to persist. Preserves YAML style for minimal diffs. |
| `pnpm seo:frontmatter` | Missing/duplicate slugs, future dates, missing description/author/category, very-short titles. |
| `pnpm seo:descriptions` | Missing, too short (<80), too long (>160), duplicate, generic descriptions. `--json` for machine output. |
| `pnpm seo:titles` | Duplicates, too-short (<25), too-long (>70), missing intent verb. |
| `pnpm seo:weak-titles` | Short titles missing year or intent words — top zero-click candidates. |
| `pnpm seo:duplicate-meta` | Duplicate title/description across posts (Google clustering risk). |
| `pnpm seo:tags` | Tag counts, low-usage tags, inconsistent case, suspected spam. Writes `reports/tag-audit.json`. |
| `pnpm seo:image-alt` | Empty / generic / too-short `![alt]` text in markdown images. |
| `pnpm seo:thin-content` | Word counts; flags posts <200 (very thin) and 200–299 (thin) words. |
| `pnpm seo:faq` | Posts with `## FAQ` heading; flags <2 valid pairs and answers <60 chars. |
| `pnpm seo:howto` | Posts eligible for HowTo JSON-LD (how-to titles + ≥3 procedural H2s with code). |
| `pnpm seo:anchors` | Anchor-text diversity: monotony (same anchor reused) and generic ("click here"). |
| `pnpm seo:orphans` | Posts with zero incoming `/blog/<slug>` links. `--json` / `--max=N`. |
| `pnpm seo:broken-links` | Internal links to missing posts/static routes; suggests close matches. |
| `pnpm seo:redirected-links` | Internal links matching a redirect rule in `next.config.mjs` (update to final URL). |
| `pnpm seo:sitemap` | Diff live `/sitemap.xml` vs filesystem; check non-https / wrong-host / trailing slashes. |
| `pnpm seo:validate-jsonld` | Walk `.next/` HTML or `--url=` to validate `application/ld+json` blocks. Run after `pnpm build`. |
| `pnpm seo:rss` | Generate static `public/rss-static.xml`. Pass `--overwrite` to write `feed.xml` + `rss.xml` (will **shadow** the dynamic `/feed.xml` route). |
| `pnpm seo:llms` | Generate `public/llms-blog.txt` (index) and `public/llms-blog-full.txt` (full content for LLM crawlers). Pass `--overwrite` to clobber the hand-curated `public/llms.txt` + `public/llms-full.txt`. |
| `pnpm seo:indexnow` | Submit live sitemap URLs to IndexNow. Requires `INDEXNOW_KEY` env var. |
| `pnpm seo:optimize-images` | Generate `.webp` and `.avif` next to JPG/PNG in `public/{blog,images,courses}`. Requires `pnpm add -D sharp`. |

## Reports

`reports/` is created on demand and ignored by the build. Two scripts persist machine-readable output:

- `reports/seo-audit.json` — pass/fail summary of every auditor (from `seo:audit`).
- `reports/tag-audit.json` — tag counts and groupings (from `seo:tags`).

## Existing scripts (kept)

- `submit-indexnow.mjs` / `submit-indexnow.ts` — pre-existing, equivalent to `submit-indexnow.cjs`.
- `fetch-mux-playback-ids.sh`, `fix-playback-ids.ts`, `validate-quickstart.sh` — project-specific, untouched.

## Scripts intentionally NOT ported

These ansiblepilot scripts are tightly coupled to that site's architecture (Vite SSG, video catalog, OS-tutorial generators, Vercel-specific edge routes) and have no equivalent in the Next.js / Mux / Prisma stack here:

- `generate-static-pages.cjs`, `generate-prerender-routes.cjs`, `build-edge-routes.cjs` — Next.js handles SSG/rendering natively.
- `generate-video-sitemap.cjs`, `fix-video-indexing.cjs`, `audit-stale-thumbnail-404s.cjs`, `bust-stale-thumbnail-cache.cjs`, `check-jsonld-uploadDate.*` — video-pages-specific (we use Mux + dynamic route).
- `generate-os-tutorials.cjs`, `enrich-install-pages.cjs`, `enrich-release-notes.cjs`, `enrich-tutorial-tags.cjs`, `fix-tutorial-dates.cjs`, `add-comparison-articles.cjs`, `generate-cheatsheet.cjs`, `mirror-article-redirects-to-videos.cjs` — content-generators bound to AnsiblePilot's editorial taxonomy.
- `cleanup-tags.cjs`, `cleanup-redirects.cjs`, `content-based-tag-enrichment.cjs`, `diversify-anchor-text.cjs`, `fix-broken-links.cjs`, `fix-internal-links.cjs`, `fix-redirect-links.cjs`, `inject-seo-links.cjs`, `link-orphans.cjs`, `normalize-internal-links.cjs`, `add-internal-links.cjs` — automated **fix** scripts. The corresponding **audit** scripts are ported; running fixers blindly on a different domain is risky, so we surface the issues and leave fixes to manual editing.
- `test-nlweb.cjs`, `test-image-optimization.cjs`, `test-video-structured-data.cjs`, `prepare-test.cjs`, `audit-production-404s.cjs`, `sample-broken-outbound.cjs`, `check-backlink-targets.cjs` — tests / one-off probes of the live AnsiblePilot domain.
- `audit-sitemap-canonicals.cjs`, `audit-sitemap-overlap.cjs`, `audit-sitemap-redirects.cjs` — folded into `audit-sitemap.cjs`.
- `audit-duplicate-titles.cjs` — folded into `audit-duplicate-meta.cjs`.
- `generate-image-variants.cjs` — folded into `optimize-images.cjs`.
- `generate-llms-full.sh` — reimplemented in Node as `generate-llms.cjs`.

Re-port any of the above on demand.
