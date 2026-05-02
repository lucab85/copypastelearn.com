"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ArrowRight, Search, X, ChevronDown } from "lucide-react";

const POSTS_PER_PAGE = 24;

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  category: string;
}

interface BlogListProps {
  posts: BlogPost[];
  categories: string[];
  tags: string[];
}

export function BlogList({ posts, categories, tags }: BlogListProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);

  const filtered = useMemo(() => {
    return posts.filter((post) => {
      if (activeCategory && post.category !== activeCategory) return false;
      if (activeTag && !post.tags.includes(activeTag)) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          post.title.toLowerCase().includes(q) ||
          post.description.toLowerCase().includes(q) ||
          post.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [posts, search, activeCategory, activeTag]);

  // Reset visible count when filters change
  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const hasFilters = search || activeCategory || activeTag;

  function handleFilterChange() {
    setVisibleCount(POSTS_PER_PAGE);
  }

  return (
    <div>
      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search articles..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            handleFilterChange();
          }}
          className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-10 text-sm outline-none transition-colors focus:border-primary"
        />
        {search && (
          <button
            onClick={() => {
              setSearch("");
              handleFilterChange();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setActiveCategory(null);
              handleFilterChange();
            }}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              !activeCategory
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(activeCategory === cat ? null : cat);
                handleFilterChange();
              }}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                setActiveTag(activeTag === tag ? null : tag);
                handleFilterChange();
              }}
              className={`rounded-md px-2 py-0.5 text-xs transition-colors ${
                activeTag === tag
                  ? "bg-primary/20 text-primary font-semibold"
                  : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Active filters */}
      {hasFilters && (
        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            {filtered.length} {filtered.length === 1 ? "result" : "results"}
          </span>
          <button
            onClick={() => {
              setSearch("");
              setActiveCategory(null);
              setActiveTag(null);
              handleFilterChange();
            }}
            className="ml-auto text-xs text-primary hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Posts */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
          <Search className="mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-muted-foreground">No posts match your filters.</p>
          <button
            onClick={() => {
              setSearch("");
              setActiveCategory(null);
              setActiveTag(null);
              handleFilterChange();
            }}
            className="mt-2 text-sm text-primary hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {visible.map((post) => (
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

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => setVisibleCount((prev) => prev + POSTS_PER_PAGE)}
                className="flex items-center gap-2 rounded-lg border bg-background px-6 py-3 text-sm font-medium text-foreground shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
              >
                <ChevronDown className="h-4 w-4" />
                Load more ({filtered.length - visibleCount} remaining)
              </button>
            </div>
          )}

          {/* Post count */}
          {!hasMore && filtered.length > POSTS_PER_PAGE && (
            <p className="pt-2 text-center text-xs text-muted-foreground">
              Showing all {filtered.length} articles
            </p>
          )}
        </div>
      )}
    </div>
  );
}
