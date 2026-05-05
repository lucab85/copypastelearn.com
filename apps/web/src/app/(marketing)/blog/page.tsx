import type { Metadata } from "next";
import { getAllPosts } from "@/lib/blog";
import { Rss } from "lucide-react";
import { BlogList } from "@/components/blog/blog-list";
import { PageEventTracker } from "@/components/analytics/page-event-tracker";

export const metadata: Metadata = {
  title: "Blog — IT Automation Insights",
  description:
    "Tips, tutorials, and updates from the CopyPasteLearn team on IT automation, Docker, Ansible, Terraform, Kubernetes, and more.",
  alternates: { canonical: "/blog" },
  openGraph: {
    url: "/blog",
    type: "website",
    title: "Blog — IT Automation Insights",
    description:
      "Tips, tutorials, and updates on IT automation, Docker, Ansible, and more.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog — IT Automation Insights",
    description:
      "Tips, tutorials, and updates on IT automation, Docker, Ansible, and more.",
  },
};

function BlogBreadcrumbJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.copypastelearn.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: "https://www.copypastelearn.com/blog",
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

function BlogItemListJsonLd(posts: { slug: string; title: string }[]) {
  const data = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "CopyPasteLearn Blog",
    description:
      "Tips, tutorials, and updates on IT automation, Docker, Ansible, Terraform, Kubernetes, and more.",
    url: "https://www.copypastelearn.com/blog",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: posts.length,
      itemListElement: posts.slice(0, 30).map((post, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `https://www.copypastelearn.com/blog/${post.slug}`,
        name: post.title,
      })),
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default function BlogPage() {
  const posts = getAllPosts();

  // Extract unique categories and tag stats (with counts, sorted by frequency).
  const categories = [...new Set(posts.map((p) => p.category))].sort();
  const tagCounts = new Map<string, number>();
  for (const p of posts) {
    for (const t of p.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  }
  const tags = [...tagCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  // Strip content for client component (not needed for listing)
  const postsWithoutContent = posts.map(({ content, image, ...rest }) => rest);

  return (
    <div>
      <BlogBreadcrumbJsonLd />
      {BlogItemListJsonLd(posts)}
      <PageEventTracker event="view_blog_list" params={{ post_count: posts.length }} />
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-12 lg:py-16">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Blog
              </h1>
              <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
                Tips, tutorials, and updates from the CopyPasteLearn team.
              </p>
            </div>
            <span className="hidden text-sm text-muted-foreground sm:block">
              {posts.length} articles
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20">
            <Rss className="mb-4 h-10 w-10 text-muted-foreground/50" />
            <p className="text-lg font-medium text-muted-foreground">
              No posts yet.
            </p>
            <p className="mt-1 text-sm text-muted-foreground/70">
              We&apos;re working on our first articles — check back soon!
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl">
            <BlogList
              posts={postsWithoutContent}
              categories={categories}
              tags={tags}
            />
          </div>
        )}
      </div>
    </div>
  );
}
