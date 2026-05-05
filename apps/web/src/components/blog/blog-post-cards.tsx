import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BlogPost } from "@/lib/blog";

/**
 * Pure server-rendered list of blog post cards. Used by tag and category
 * index pages where filtering is implicit (the route IS the filter), so we
 * don't need the client-side search/category UI from <BlogList>.
 */
export function BlogPostCards({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) {
    return (
      <p className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
        No posts yet.
      </p>
    );
  }

  return (
    <div className="space-y-6">
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
                <span className="text-muted-foreground/50">·</span>
                <span className="font-medium">{post.category}</span>
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
                    <Badge key={tag} variant="secondary" className="text-xs">
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
  );
}
