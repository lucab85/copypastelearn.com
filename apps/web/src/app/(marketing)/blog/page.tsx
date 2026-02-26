import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Rss, Calendar, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog — IT Automation Insights",
  description:
    "Tips, tutorials, and updates from the CopyPasteLearn team on IT automation, Docker, Ansible, and more.",
  alternates: { canonical: "/blog" },
  openGraph: {
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

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div>
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-12 lg:py-16">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Blog
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            Tips, tutorials, and updates from the CopyPasteLearn team.
          </p>
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
          <div className="mx-auto max-w-3xl space-y-6">
            {posts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`}>
                <Card className="group transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(post.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                      <span className="text-muted-foreground/50">·</span>
                      <span>{post.author}</span>
                    </div>
                    <CardTitle className="text-xl leading-snug transition-colors group-hover:text-primary">
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                      {post.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1.5">
                        {post.tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <span className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                        Read more
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
