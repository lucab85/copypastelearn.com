import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPost, getAllPosts } from "@/lib/blog";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, User } from "lucide-react";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
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

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPost(slug);

  if (!post) {
    notFound();
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://www.copypastelearn.com";

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: {
      "@type": "Person",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: "CopyPasteLearn",
      url: siteUrl,
    },
    url: `${siteUrl}/blog/${slug}`,
    ...(post.image && {
      image: post.image.startsWith("http")
        ? post.image
        : `${siteUrl}${post.image}`,
    }),
    keywords: post.tags,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/blog/${slug}`,
    },
  };

  // Simple markdown to HTML — extract code blocks first (they may contain blank lines)
  const codeBlocks: string[] = [];
  const contentWithPlaceholders = post.content.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    (_match, lang, code) => {
      const idx = codeBlocks.length;
      const escaped = code.replace(/</g, "&lt;").replace(/>/g, "&gt;").trimEnd();
      codeBlocks.push(
        `<pre class="my-6 overflow-x-auto rounded-lg bg-muted p-4">${lang ? `<div class="mb-2 text-xs font-mono text-muted-foreground">${lang}</div>` : ""}<code class="text-sm">${escaped}</code></pre>`
      );
      return `\n\n__CODE_BLOCK_${idx}__\n\n`;
    }
  );

  const contentHtml = contentWithPlaceholders
    .split("\n\n")
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";

      // Code block placeholders
      const codeMatch = trimmed.match(/^__CODE_BLOCK_(\d+)__$/);
      if (codeMatch) return codeBlocks[parseInt(codeMatch[1])];

      // Headers
      if (trimmed.startsWith("### "))
        return `<h3 class="mt-8 mb-3 text-lg font-semibold">${inlineFormat(trimmed.slice(4))}</h3>`;
      if (trimmed.startsWith("## "))
        return `<h2 class="mt-10 mb-4 text-xl font-bold">${inlineFormat(trimmed.slice(3))}</h2>`;
      if (trimmed.startsWith("# "))
        return `<h1 class="mt-10 mb-4 text-2xl font-bold">${inlineFormat(trimmed.slice(2))}</h1>`;

      // Tables
      if (trimmed.includes("|") && trimmed.split("\n").length >= 2) {
        const rows = trimmed.split("\n").filter((r) => r.trim());
        if (rows.length >= 2 && /^\|?[\s-:|]+\|/.test(rows[1])) {
          const parseRow = (row: string) => {
            const cells = row.split("|").map((c) => c.trim());
            // Remove first/last empty strings from leading/trailing pipes
            if (cells[0] === "") cells.shift();
            if (cells[cells.length - 1] === "") cells.pop();
            return cells;
          };
          const headers = parseRow(rows[0]);
          const bodyRows = rows.slice(2).map(parseRow);
          const ths = headers.map((h) => `<th class="border border-border px-4 py-2 text-left text-sm font-semibold">${inlineFormat(h)}</th>`).join("");
          const trs = bodyRows.map((cols) => {
            const tds = cols.map((c) => `<td class="border border-border px-4 py-2 text-sm text-muted-foreground">${inlineFormat(c)}</td>`).join("");
            return `<tr class="even:bg-muted/50">${tds}</tr>`;
          }).join("");
          return `<div class="my-6 overflow-x-auto"><table class="w-full border-collapse border border-border rounded-lg"><thead><tr class="bg-muted">${ths}</tr></thead><tbody>${trs}</tbody></table></div>`;
        }
      }

      // Unordered lists
      if (trimmed.split("\n").every((l) => l.startsWith("- "))) {
        const items = trimmed
          .split("\n")
          .map((l) => `<li class="ml-4">${inlineFormat(l.slice(2))}</li>`)
          .join("");
        return `<ul class="my-4 list-disc space-y-1 pl-4">${items}</ul>`;
      }

      // Ordered lists
      if (trimmed.split("\n").every((l) => /^\d+\.\s/.test(l))) {
        const items = trimmed
          .split("\n")
          .map((l) => `<li class="ml-4">${inlineFormat(l.replace(/^\d+\.\s/, ""))}</li>`)
          .join("");
        return `<ol class="my-4 list-decimal space-y-1 pl-4">${items}</ol>`;
      }

      // Paragraph
      return `<p class="my-4 leading-relaxed text-muted-foreground">${inlineFormat(trimmed)}</p>`;
    })
    .join("\n");

  return (
    <div className="container mx-auto px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <Link
        href="/blog"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Blog
      </Link>

      <article className="mx-auto max-w-2xl">
        <header className="mb-8">
          <div className="mb-4 flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {post.title}
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            {post.description}
          </p>
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {new Date(post.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              {post.author}
            </span>
          </div>
        </header>

        <div
          className="prose prose-neutral dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />

        {/* CTA: Enroll in Courses */}
        <div className="mt-12 rounded-xl border bg-gradient-to-br from-primary/5 to-primary/10 p-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            Ready to Learn by Doing?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Go beyond blog posts with hands-on video courses. Build real projects with Docker, Ansible, Node.js, and more.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/courses"
              className="inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              Browse Courses
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center rounded-lg border px-6 py-3 text-sm font-semibold transition-colors hover:bg-muted"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}

/** Inline markdown formatting: bold, italic, code, links */
function inlineFormat(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, '<code class="rounded bg-muted px-1.5 py-0.5 text-sm">$1</code>')
    .replace(
      /\[(.+?)\]\((.+?)\)/g,
      '<a href="$2" class="text-primary hover:underline">$1</a>'
    );
}
