import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { TrackedLink } from "@/components/analytics/tracked-link";
import { PageEventTracker } from "@/components/analytics/page-event-tracker";
import { getPost, getAllPosts, type BlogPost } from "@/lib/blog";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Clock, User, BookOpen } from "lucide-react";
import { ReadingProgressBar } from "@/components/blog/reading-progress-bar";
import { ShareButtons } from "@/components/blog/share-buttons";
import { TableOfContents } from "@/components/blog/table-of-contents";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};

  const siteUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://www.copypastelearn.com";

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      url: `/blog/${slug}`,
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
      ...(post.image && {
        images: [
          {
            url: post.image.startsWith("http")
              ? post.image
              : `${siteUrl}${post.image}`,
            width: 1200,
            height: 630,
          },
        ],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      ...(post.image && {
        images: [
          post.image.startsWith("http")
            ? post.image
            : `${siteUrl}${post.image}`,
        ],
      }),
    },
  };
}

/* ─── Helpers ───────────────────────────────────── */

function readingTime(content: string): number {
  const words = content.replace(/```[\s\S]*?```/g, "").split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 230));
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

function extractTOC(content: string): TOCItem[] {
  const items: TOCItem[] = [];
  // Remove code blocks first
  const cleaned = content.replace(/```[\s\S]*?```/g, "");
  const lines = cleaned.split("\n");
  for (const line of lines) {
    const match = line.match(/^(#{2,3})\s+(.+)/);
    if (match) {
      const text = match[2].replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1");
      items.push({
        id: slugify(text),
        text,
        level: match[1].length,
      });
    }
  }
  return items;
}

function getRelatedPosts(currentSlug: string, category: string, tags: string[]): BlogPost[] {
  const all = getAllPosts();
  const scored = all
    .filter((p) => p.slug !== currentSlug)
    .map((p) => {
      let score = 0;
      if (p.category === category) score += 3;
      score += p.tags.filter((t) => tags.includes(t)).length;
      return { post: p, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, 3).map((s) => s.post);
}

/** Inline markdown formatting: bold, italic, code, links */
function inlineFormat(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, '<code class="rounded bg-zinc-800 px-1.5 py-0.5 text-sm text-zinc-300 font-mono">$1</code>')
    .replace(
      /\[(.+?)\]\((.+?)\)/g,
      '<a href="$2" class="text-blue-400 hover:text-blue-300 underline underline-offset-2 decoration-blue-400/30 hover:decoration-blue-300">$1</a>'
    );
}

/* ─── Mid-article promo cards ──────────────────── */

function MidArticlePromo({ variant }: { variant: "courses" | "newsletter" | "pricing" }) {
  if (variant === "courses") {
    return (
      <div className="my-10 rounded-xl border border-zinc-800 bg-gradient-to-br from-blue-950/40 to-zinc-900 p-6 sm:p-8">
        <div className="flex items-start gap-3 mb-3">
          <BookOpen className="mt-0.5 h-5 w-5 text-blue-400 shrink-0" />
          <div className="text-xs font-semibold uppercase tracking-wider text-blue-400">
            Related Course
          </div>
        </div>
        <h3 className="text-lg font-bold text-white mb-2">
          Master this topic with hands-on labs
        </h3>
        <p className="text-sm text-zinc-400 mb-4">
          Go beyond reading — build real projects in sandboxed environments with expert video guidance.
        </p>
        <TrackedLink
          href="/courses"
          ctaText="Browse Courses"
          ctaLocation="blog_mid_article"
          className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
        >
          Browse Courses →
        </TrackedLink>
      </div>
    );
  }

  if (variant === "newsletter") {
    return (
      <div className="my-10 rounded-xl border border-zinc-800 bg-gradient-to-br from-purple-950/40 to-zinc-900 p-6 sm:p-8">
        <div className="text-xs font-semibold uppercase tracking-wider text-purple-400 mb-3">
          Stay Updated
        </div>
        <h3 className="text-lg font-bold text-white mb-2">
          Get weekly IT automation tips
        </h3>
        <p className="text-sm text-zinc-400 mb-4">
          Docker, Ansible, Terraform, MLOps — curated insights delivered to your inbox. No spam.
        </p>
        <TrackedLink
          href="https://luca-berton.kit.com/ce74a48bfa"
          ctaText="Subscribe Free"
          ctaLocation="blog_mid_article"
          className="inline-flex items-center rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-500 transition-colors"
        >
          Subscribe Free →
        </TrackedLink>
      </div>
    );
  }

  // pricing
  return (
    <div className="my-10 rounded-xl border border-zinc-800 bg-gradient-to-br from-emerald-950/40 to-zinc-900 p-6 sm:p-8">
      <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-3">
        Pro Subscription
      </div>
      <h3 className="text-lg font-bold text-white mb-2">
        Unlock all courses &amp; labs
      </h3>
      <p className="text-sm text-zinc-400 mb-4">
        Full access to every course, interactive lab, code snippet, and future content. Cancel anytime.
      </p>
      <TrackedLink
        href="/pricing"
        ctaText="View Plans"
        ctaLocation="blog_mid_article"
        className="inline-flex items-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
      >
        View Plans — From €29/mo →
      </TrackedLink>
    </div>
  );
}

/* ─── Content renderer ─────────────────────────── */

function renderContent(content: string): { html: string; promoInsertions: number[] } {
  const codeBlocks: string[] = [];
  const withPlaceholders = content.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    (_match, lang, code) => {
      const idx = codeBlocks.length;
      const escaped = code.replace(/</g, "&lt;").replace(/>/g, "&gt;").trimEnd();
      codeBlocks.push(
        `<div class="my-6 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900">${
          lang
            ? `<div class="flex items-center justify-between border-b border-zinc-800 px-4 py-2"><span class="text-xs font-mono text-zinc-500 uppercase">${lang}</span></div>`
            : ""
        }<pre class="p-4"><code class="text-sm font-mono text-zinc-300 leading-relaxed">${escaped}</code></pre></div>`
      );
      return `\n\n__CODE_BLOCK_${idx}__\n\n`;
    }
  );

  const blocks = withPlaceholders.split("\n\n").map((block) => {
    const trimmed = block.trim();
    if (!trimmed) return "";

    const codeMatch = trimmed.match(/^__CODE_BLOCK_(\d+)__$/);
    if (codeMatch) return codeBlocks[parseInt(codeMatch[1])];

    if (trimmed.startsWith("### ")) {
      const firstLine = trimmed.split("\n")[0].slice(4);
      const rest = trimmed.split("\n").slice(1).join("\n").trim();
      const id = slugify(firstLine.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1"));
      const headingHtml = `<h3 id="${id}" class="mt-10 mb-4 text-xl font-bold text-white scroll-mt-24">${inlineFormat(firstLine)}</h3>`;
      if (rest) {
        const restBlock = rest.split("\n").every((l) => l.startsWith("- "))
          ? `<ul class="my-4 space-y-2 pl-6 text-muted-foreground">${rest.split("\n").map((l) => `<li class="list-disc">${inlineFormat(l.slice(2))}</li>`).join("")}</ul>`
          : `<p class="my-4 leading-[1.8] text-muted-foreground">${inlineFormat(rest)}</p>`;
        return headingHtml + restBlock;
      }
      return headingHtml;
    }
    if (trimmed.startsWith("## ")) {
      const firstLine = trimmed.split("\n")[0].slice(3);
      const rest = trimmed.split("\n").slice(1).join("\n").trim();
      const id = slugify(firstLine.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1"));
      const headingHtml = `<h2 id="${id}" class="mt-14 mb-5 text-2xl font-bold text-white scroll-mt-24">${inlineFormat(firstLine)}</h2>`;
      if (rest) {
        const restBlock = rest.split("\n").every((l) => l.startsWith("- "))
          ? `<ul class="my-4 space-y-2 pl-6 text-muted-foreground">${rest.split("\n").map((l) => `<li class="list-disc">${inlineFormat(l.slice(2))}</li>`).join("")}</ul>`
          : `<p class="my-4 leading-[1.8] text-muted-foreground">${inlineFormat(rest)}</p>`;
        return headingHtml + restBlock;
      }
      return headingHtml;
    }
    if (trimmed.startsWith("# ")) {
      const firstLine = trimmed.split("\n")[0].slice(2);
      const id = slugify(firstLine.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1"));
      return `<h1 id="${id}" class="mt-14 mb-5 text-3xl font-bold text-white scroll-mt-24">${inlineFormat(firstLine)}</h1>`;
    }

    // Tables
    if (trimmed.includes("|") && trimmed.split("\n").length >= 2) {
      const rows = trimmed.split("\n").filter((r) => r.trim());
      if (rows.length >= 2 && /^\|?[\s-:|]+\|/.test(rows[1])) {
        const parseRow = (row: string) => {
          const cells = row.split("|").map((c) => c.trim());
          if (cells[0] === "") cells.shift();
          if (cells[cells.length - 1] === "") cells.pop();
          return cells;
        };
        const headers = parseRow(rows[0]);
        const bodyRows = rows.slice(2).map(parseRow);
        const ths = headers
          .map((h) => `<th class="border border-zinc-700 px-4 py-3 text-left text-sm font-semibold text-zinc-200">${inlineFormat(h)}</th>`)
          .join("");
        const trs = bodyRows
          .map((cols) => {
            const tds = cols
              .map((c) => `<td class="border border-zinc-700 px-4 py-3 text-sm text-zinc-400">${inlineFormat(c)}</td>`)
              .join("");
            return `<tr class="even:bg-zinc-800/50">${tds}</tr>`;
          })
          .join("");
        return `<div class="my-6 overflow-x-auto rounded-xl border border-zinc-800"><table class="w-full border-collapse"><thead><tr class="bg-zinc-800/80">${ths}</tr></thead><tbody>${trs}</tbody></table></div>`;
      }
    }

    // Unordered lists
    if (trimmed.split("\n").every((l) => l.startsWith("- "))) {
      const items = trimmed
        .split("\n")
        .map((l) => `<li class="pl-2 text-zinc-300">${inlineFormat(l.slice(2))}</li>`)
        .join("");
      return `<ul class="my-5 list-disc space-y-2 pl-6 marker:text-zinc-600">${items}</ul>`;
    }

    // Ordered lists
    if (trimmed.split("\n").every((l) => /^\d+\.\s/.test(l))) {
      const items = trimmed
        .split("\n")
        .map((l) => `<li class="pl-2 text-zinc-300">${inlineFormat(l.replace(/^\d+\.\s/, ""))}</li>`)
        .join("");
      return `<ol class="my-5 list-decimal space-y-2 pl-6 marker:text-zinc-500">${items}</ol>`;
    }

    // Blockquotes
    if (trimmed.split("\n").every((l) => l.startsWith("> "))) {
      const text = trimmed
        .split("\n")
        .map((l) => l.slice(2))
        .join(" ");
      return `<blockquote class="my-6 border-l-4 border-blue-500/50 bg-zinc-900/50 py-4 pl-6 pr-4 rounded-r-lg text-zinc-300 italic">${inlineFormat(text)}</blockquote>`;
    }

    // Paragraph
    return `<p class="my-5 text-lg leading-[1.8] text-zinc-300">${inlineFormat(trimmed)}</p>`;
  }).filter(Boolean);

  // Determine promo insertion points (after ~33% and ~66% of content)
  const h2Indices = blocks
    .map((b, i) => (b.includes("<h2 ") ? i : -1))
    .filter((i) => i >= 0);

  const promoInsertions: number[] = [];
  if (h2Indices.length >= 3) {
    promoInsertions.push(h2Indices[Math.floor(h2Indices.length / 3)]);
    promoInsertions.push(h2Indices[Math.floor((h2Indices.length * 2) / 3)]);
  } else if (h2Indices.length >= 2) {
    promoInsertions.push(h2Indices[1]);
  } else if (blocks.length > 6) {
    promoInsertions.push(Math.floor(blocks.length / 2));
  }

  // Insert promo placeholders
  const promoVariants: Array<"courses" | "newsletter" | "pricing"> = ["courses", "newsletter", "pricing"];
  let offset = 0;
  for (let i = 0; i < promoInsertions.length && i < 2; i++) {
    const idx = promoInsertions[i] + offset;
    blocks.splice(idx, 0, `__PROMO_${promoVariants[i]}__`);
    offset++;
  }

  return { html: blocks.join("\n"), promoInsertions };
}

/* ─── Page component ───────────────────────────── */

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const siteUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://www.copypastelearn.com";
  const postUrl = `${siteUrl}/blog/${slug}`;
  const minutes = readingTime(post.content);
  const tocItems = extractTOC(post.content);
  const relatedPosts = getRelatedPosts(slug, post.category, post.tags);
  const { html: contentHtml } = renderContent(post.content);

  // Split content at promo placeholders to insert React components
  const contentParts = contentHtml.split(/__PROMO_(courses|newsletter|pricing)__/);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { "@type": "Person", name: post.author },
    publisher: { "@type": "Organization", name: "CopyPasteLearn", url: siteUrl },
    url: postUrl,
    ...(post.image && {
      image: post.image.startsWith("http") ? post.image : `${siteUrl}${post.image}`,
    }),
    keywords: post.tags,
    mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
    wordCount: post.content.split(/\s+/).length,
  };

  return (
    <>
      <ReadingProgressBar />
      <PageEventTracker
        event="view_blog_post"
        params={{ blog_slug: slug, blog_title: post.title, blog_category: post.category }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      {/* Hero header */}
      <header className="border-b border-zinc-800 bg-zinc-950">
        <div className="container mx-auto px-4 py-12 lg:py-16">
          <div className="mx-auto max-w-3xl">
            <Link
              href="/blog"
              className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Link>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Link href={`/blog?category=${encodeURIComponent(post.category)}`}>
                <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30 hover:bg-blue-600/30">
                  {post.category}
                </Badge>
              </Link>
              {post.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="bg-zinc-800 text-zinc-400 border-zinc-700">
                  {tag}
                </Badge>
              ))}
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
              {post.title}
            </h1>

            <p className="mt-4 text-lg text-zinc-400 leading-relaxed">
              {post.description}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-zinc-500">
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                {post.author}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {new Date(post.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {minutes} min read
              </span>
            </div>

            <div className="mt-6">
              <ShareButtons url={postUrl} title={post.title} description={post.description} />
            </div>
          </div>
        </div>
      </header>

      {/* Body: Article + ToC sidebar */}
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-6xl lg:grid lg:grid-cols-[1fr_220px] lg:gap-12 xl:grid-cols-[1fr_240px] xl:gap-16">
          <article className="mx-auto max-w-3xl lg:mx-0">
            {/* Render content parts with promos inserted */}
            {contentParts.map((part, i) => {
              if (part === "courses") return <MidArticlePromo key={`promo-${i}`} variant="courses" />;
              if (part === "newsletter") return <MidArticlePromo key={`promo-${i}`} variant="newsletter" />;
              if (part === "pricing") return <MidArticlePromo key={`promo-${i}`} variant="pricing" />;
              return (
                <div
                  key={`content-${i}`}
                  dangerouslySetInnerHTML={{ __html: part }}
                />
              );
            })}

            {/* Bottom CTA */}
            <div className="mt-16 rounded-xl border border-zinc-800 bg-gradient-to-br from-blue-950/30 via-zinc-900 to-purple-950/30 p-8 sm:p-10 text-center">
              <h2 className="text-2xl font-bold text-white">
                Ready to learn by doing?
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-zinc-400">
                Stop reading tutorials — start building. Expert video courses with
                hands-on labs in real sandboxed environments.
              </p>
              <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <TrackedLink
                  href="/courses"
                  ctaText="Browse Courses"
                  ctaLocation="blog_post_bottom"
                  className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
                >
                  Browse Courses
                </TrackedLink>
                <TrackedLink
                  href="/pricing"
                  ctaText="View Pricing"
                  ctaLocation="blog_post_bottom"
                  className="inline-flex items-center rounded-lg border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  View Pricing
                </TrackedLink>
              </div>
            </div>

            {/* Share again at bottom */}
            <div className="mt-10 flex items-center justify-between border-t border-zinc-800 pt-8">
              <span className="text-sm text-zinc-500">Share this article</span>
              <ShareButtons url={postUrl} title={post.title} description={post.description} />
            </div>

            {/* Author card */}
            <div className="mt-10 flex items-start gap-5 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-600/20 text-2xl font-bold text-blue-400">
                LB
              </div>
              <div>
                <div className="font-semibold text-white">{post.author}</div>
                <p className="mt-1 text-sm text-zinc-400">
                  IT automation expert, Red Hat Summit &amp; KubeCon speaker.
                  Building hands-on education for DevOps engineers at CopyPasteLearn.
                </p>
                <div className="mt-3 flex gap-3 text-xs">
                  <a href="https://lucaberton.com" target="_blank" rel="noopener" className="text-blue-400 hover:text-blue-300">
                    Website
                  </a>
                  <a href="https://twitter.com/yourlinuxsa" target="_blank" rel="noopener" className="text-blue-400 hover:text-blue-300">
                    Twitter
                  </a>
                  <a href="https://www.linkedin.com/in/lucaberton/" target="_blank" rel="noopener" className="text-blue-400 hover:text-blue-300">
                    LinkedIn
                  </a>
                </div>
              </div>
            </div>

            {/* Related posts */}
            {relatedPosts.length > 0 && (
              <section className="mt-16">
                <h2 className="mb-6 text-xl font-bold text-white">
                  Related Articles
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {relatedPosts.map((p) => (
                    <Link
                      key={p.slug}
                      href={`/blog/${p.slug}`}
                      className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
                    >
                      <Badge variant="secondary" className="mb-3 bg-zinc-800 text-zinc-500 text-xs">
                        {p.category}
                      </Badge>
                      <h3 className="font-semibold text-zinc-200 group-hover:text-white transition-colors line-clamp-2">
                        {p.title}
                      </h3>
                      <p className="mt-2 text-sm text-zinc-500 line-clamp-2">
                        {p.description}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </article>

          {/* Table of Contents sidebar */}
          <TableOfContents items={tocItems} />
        </div>
      </div>
    </>
  );
}
