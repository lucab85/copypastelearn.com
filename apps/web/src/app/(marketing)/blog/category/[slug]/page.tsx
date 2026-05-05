import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, FolderOpen } from "lucide-react";
import {
  getAllCategories,
  getPostsByCategory,
  taxonomySlug,
} from "@/lib/blog-taxonomy";
import { BlogPostCards } from "@/components/blog/blog-post-cards";

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://www.copypastelearn.com";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllCategories().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = getPostsByCategory(slug);
  if (!data) return { title: "Category not found" };
  const { entry, posts } = data;
  const title = `${entry.name} — CopyPasteLearn`;
  const description = `${posts.length} ${posts.length === 1 ? "article" : "articles"} in ${entry.name}: tutorials, walkthroughs, and best practices.`;
  const url = `/blog/category/${entry.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website" },
    twitter: { card: "summary", title, description },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  if (slug !== taxonomySlug(slug)) notFound();

  const data = getPostsByCategory(slug);
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
        name: entry.name,
        item: `${SITE_URL}/blog/category/${entry.slug}`,
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
            <FolderOpen className="h-7 w-7 text-primary" />
            <span>{entry.name}</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {posts.length} {posts.length === 1 ? "article" : "articles"} in{" "}
            <span className="font-medium text-foreground">{entry.name}</span>.
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
