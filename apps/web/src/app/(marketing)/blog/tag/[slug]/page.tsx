import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Tag as TagIcon } from "lucide-react";
import {
  getAllTags,
  getPostsByTag,
  taxonomySlug,
} from "@/lib/blog-taxonomy";
import { BlogPostCards } from "@/components/blog/blog-post-cards";

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://www.copypastelearn.com";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllTags().map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = getPostsByTag(slug);
  if (!data) return { title: "Tag not found" };
  const { entry, posts } = data;
  const title = `Posts tagged "${entry.name}" — CopyPasteLearn`;
  const description = `${posts.length} ${posts.length === 1 ? "article" : "articles"} on ${entry.name}: tutorials, walkthroughs, and best practices.`;
  const url = `/blog/tag/${entry.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website" },
    twitter: { card: "summary", title, description },
  };
}

export default async function TagPage({ params }: PageProps) {
  const { slug } = await params;
  // Reject non-canonical slugs (e.g. uppercase) by re-slugging the input.
  if (slug !== taxonomySlug(slug)) notFound();

  const data = getPostsByTag(slug);
  if (!data) notFound();
  const { entry, posts } = data;

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
      {
        "@type": "ListItem",
        position: 3,
        name: `Tag: ${entry.name}`,
        item: `${SITE_URL}/blog/tag/${entry.slug}`,
      },
    ],
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-10 lg:py-12">
          <Link
            href="/blog"
            className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-3 w-3" />
            Back to blog
          </Link>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight sm:text-4xl">
            <TagIcon className="h-7 w-7 text-primary" />
            <span>{entry.name}</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {posts.length} {posts.length === 1 ? "article" : "articles"} tagged{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
              {entry.name}
            </code>
            .
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <BlogPostCards posts={posts} />
        </div>
      </div>
    </div>
  );
}
