"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  ArrowRight,
  Search,
  X,
  ChevronDown,
  Tag as TagIcon,
} from "lucide-react";

const POSTS_PER_PAGE = 24;
const TOP_TAGS = 12; // most-popular tags shown inline by default

/**
 * URL-safe slug for tag/category names. Mirrors `taxonomySlug` in
 * `lib/blog-taxonomy.ts` so the in-page filter can deep-link to the
 * dedicated `/blog/tag/...` and `/blog/category/...` SEO pages.
 */
function taxonomySlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  category: string;
}

interface TagStat {
  name: string;
  count: number;
}

interface BlogListProps {
  posts: BlogPost[];
  categories: string[];
  /**
   * Tags pre-sorted by frequency (most-used first). Each entry includes the
   * usage count so we can show a "(n)" badge.
   */
  tags: TagStat[];
}

export function BlogList({ posts, categories, tags }: BlogListProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [tagFilter, setTagFilter] = useState("");
  const searchRef = useRef<HTMLInputElement | null>(null);
  const tagFilterRef = useRef<HTMLInputElement | null>(null);

  // Keyboard: focus search on "/" (skip when user is already typing).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "/") return;
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable)
      )
        return;
      e.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Auto-focus tag-filter input when the panel opens.
  useEffect(() => {
    if (tagsOpen) tagFilterRef.current?.focus();
  }, [tagsOpen]);

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

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const hasFilters = search || activeCategory || activeTag;

  // Top-N tags shown inline; everything else lives in the expandable panel.
  const topTags = useMemo(() => tags.slice(0, TOP_TAGS), [tags]);
  const filteredAllTags = useMemo(() => {
    const q = tagFilter.trim().toLowerCase();
    if (!q) return tags;
    return tags.filter((t) => t.name.toLowerCase().includes(q));
  }, [tags, tagFilter]);

  function handleFilterChange() {
    setVisibleCount(POSTS_PER_PAGE);
  }

  function selectTag(name: string) {
    setActiveTag((prev) => (prev === name ? null : name));
    handleFilterChange();
  }

  return (
    <div>
      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={searchRef}
          type="text"
          placeholder="Search articles by title, description, or tag…"
          aria-label="Search articles"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            handleFilterChange();
          }}
          className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-20 text-sm outline-none transition-colors focus:border-primary"
        />
        {search ? (
          <button
            onClick={() => {
              setSearch("");
              handleFilterChange();
            }}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block">
            /
          </kbd>
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

      {/* Tags — show top-N inline, the rest behind a searchable panel */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-1.5">
          {topTags.map(({ name, count }) => (
            <button
              key={name}
              onClick={() => selectTag(name)}
              className={`rounded-md px-2 py-0.5 text-xs transition-colors ${
                activeTag === name
                  ? "bg-primary/20 text-primary font-semibold"
                  : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {name} <span className="text-muted-foreground/60">{count}</span>
            </button>
          ))}
          {/* Active tag, if it's not already in the top-N */}
          {activeTag && !topTags.some((t) => t.name === activeTag) && (
            <button
              onClick={() => selectTag(activeTag)}
              className="rounded-md bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary"
            >
              {activeTag}
            </button>
          )}
          {tags.length > TOP_TAGS && (
            <button
              onClick={() => setTagsOpen((v) => !v)}
              aria-expanded={tagsOpen}
              className="ml-1 inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <TagIcon className="h-3 w-3" />
              {tagsOpen ? "Hide tags" : `All tags (${tags.length})`}
              <ChevronDown
                className={`h-3 w-3 transition-transform ${
                  tagsOpen ? "rotate-180" : ""
                }`}
              />
            </button>
          )}
        </div>

        {tagsOpen && (
          <div className="mt-3 rounded-lg border bg-muted/20 p-3">
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={tagFilterRef}
                type="text"
                placeholder="Filter tags…"
                aria-label="Filter tags"
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="w-full rounded-md border bg-background py-1.5 pl-8 pr-8 text-xs outline-none focus:border-primary"
              />
              {tagFilter && (
                <button
                  onClick={() => setTagFilter("")}
                  aria-label="Clear tag filter"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            {filteredAllTags.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                No tags match &quot;{tagFilter}&quot;.
              </p>
            ) : (
              <div className="max-h-72 overflow-y-auto pr-1">
                <div className="flex flex-wrap gap-1.5">
                  {filteredAllTags.map(({ name, count }) => (
                    <button
                      key={name}
                      onClick={() => selectTag(name)}
                      className={`rounded-md px-2 py-0.5 text-xs transition-colors ${
                        activeTag === name
                          ? "bg-primary/20 text-primary font-semibold"
                          : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {name}{" "}
                      <span className="text-muted-foreground/60">{count}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Active filters */}
      {hasFilters && (
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>
            {filtered.length} {filtered.length === 1 ? "result" : "results"}
          </span>
          {activeTag && (
            <Link
              href={`/blog/tag/${taxonomySlug(activeTag)}`}
              className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs text-primary hover:bg-primary/5"
              title="Open dedicated tag page"
            >
              View tag page
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
          {activeCategory && (
            <Link
              href={`/blog/category/${taxonomySlug(activeCategory)}`}
              className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs text-primary hover:bg-primary/5"
              title="Open dedicated category page"
            >
              View {activeCategory} page
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
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
