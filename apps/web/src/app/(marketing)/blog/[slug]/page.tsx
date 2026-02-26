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

  // Simple markdown to HTML (basic — handles headers, bold, italic, code, links, lists)
  const contentHtml = post.content
    .split("\n\n")
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";

      // Headers
      if (trimmed.startsWith("### "))
        return `<h3 class="mt-8 mb-3 text-lg font-semibold">${trimmed.slice(4)}</h3>`;
      if (trimmed.startsWith("## "))
        return `<h2 class="mt-10 mb-4 text-xl font-bold">${trimmed.slice(3)}</h2>`;
      if (trimmed.startsWith("# "))
        return `<h1 class="mt-10 mb-4 text-2xl font-bold">${trimmed.slice(2)}</h1>`;

      // Code blocks
      if (trimmed.startsWith("```")) {
        const lines = trimmed.split("\n");
        const code = lines.slice(1, -1).join("\n");
        return `<pre class="my-6 overflow-x-auto rounded-lg bg-muted p-4"><code class="text-sm">${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`;
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
