"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, Hash, FolderOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

interface IndexItem {
  slug: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
}

interface Result {
  type: "post" | "tag" | "category";
  href: string;
  title: string;
  subtitle?: string;
  score: number;
}

const MAX_RESULTS = 12;

function score(haystack: string, q: string): number {
  if (!q) return 0;
  const h = haystack.toLowerCase();
  const needle = q.toLowerCase();
  // Exact / prefix > word-boundary > substring; rough heuristic.
  if (h === needle) return 1000;
  if (h.startsWith(needle)) return 500;
  const wb = new RegExp(`\\b${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(h);
  if (wb) return 200;
  if (h.includes(needle)) return 100;
  return 0;
}

function taxonomySlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CmdKPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<IndexItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [active, setActive] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Open with Cmd+K / Ctrl+K. Skip when user is in another input — except
  // the meta-key combo, which always wins. Also responds to a custom
  // `cmdk:open` event so other UI (e.g. the header search button) can
  // trigger the palette without importing this component.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (isCmdK) {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    function onOpenEvent() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("cmdk:open", onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("cmdk:open", onOpenEvent);
    };
  }, [open]);

  // Lazy-load the index on first open; cache for the session.
  useEffect(() => {
    if (!open || loaded) return;
    let cancelled = false;
    fetch("/api/blog/search-index")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setItems(data.items || []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, [open, loaded]);

  // Reset on close.
  useEffect(() => {
    if (!open) {
      setQuery("");
      setActive(0);
    } else {
      // Defer so radix has mounted the input.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const results: Result[] = useMemo(() => {
    const q = query.trim();
    if (!q) {
      // Empty query: show recent posts as a starting point.
      return items.slice(0, MAX_RESULTS).map((p) => ({
        type: "post" as const,
        href: `/blog/${p.slug}`,
        title: p.title,
        subtitle: p.category,
        score: 0,
      }));
    }
    const out: Result[] = [];
    const seenTags = new Set<string>();
    const seenCats = new Set<string>();
    for (const p of items) {
      const titleScore = score(p.title, q) * 3;
      const descScore = score(p.description, q);
      const tagScore = p.tags.reduce((acc, t) => acc + score(t, q) * 2, 0);
      const total = titleScore + descScore + tagScore;
      if (total > 0) {
        out.push({
          type: "post",
          href: `/blog/${p.slug}`,
          title: p.title,
          subtitle: p.description,
          score: total,
        });
      }
      // Surface matching tags / categories as separate result rows.
      if (!seenCats.has(p.category) && score(p.category, q) > 0) {
        seenCats.add(p.category);
        out.push({
          type: "category",
          href: `/blog/category/${taxonomySlug(p.category)}`,
          title: p.category,
          subtitle: "Category",
          score: 250,
        });
      }
      for (const t of p.tags) {
        if (!seenTags.has(t) && score(t, q) > 0) {
          seenTags.add(t);
          out.push({
            type: "tag",
            href: `/blog/tag/${taxonomySlug(t)}`,
            title: t,
            subtitle: "Tag",
            score: 220,
          });
        }
      }
    }
    out.sort((a, b) => b.score - a.score);
    // Dedupe by href.
    const seen = new Set<string>();
    const dedup: Result[] = [];
    for (const r of out) {
      if (seen.has(r.href)) continue;
      seen.add(r.href);
      dedup.push(r);
      if (dedup.length >= MAX_RESULTS) break;
    }
    return dedup;
  }, [items, query]);

  // Clamp active index when results shrink.
  useEffect(() => {
    if (active >= results.length) setActive(0);
  }, [active, results.length]);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = results[active];
      if (r) navigate(r.href);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-2xl">
        <DialogTitle className="sr-only">Search</DialogTitle>
        <div className="relative border-b">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search posts, tags, categories…"
            aria-label="Search"
            className="w-full bg-transparent py-4 pl-11 pr-4 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="max-h-96 overflow-y-auto py-2">
          {!loaded && (
            <p className="px-4 py-6 text-center text-xs text-muted-foreground">
              Loading…
            </p>
          )}
          {loaded && results.length === 0 && (
            <p className="px-4 py-6 text-center text-xs text-muted-foreground">
              {query
                ? `No matches for "${query}".`
                : "Type to search posts, tags, or categories."}
            </p>
          )}
          {results.map((r, i) => {
            const Icon =
              r.type === "post" ? FileText : r.type === "tag" ? Hash : FolderOpen;
            return (
              <button
                key={r.href}
                onMouseEnter={() => setActive(i)}
                onClick={() => navigate(r.href)}
                className={`flex w-full items-start gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                  i === active ? "bg-muted" : "hover:bg-muted/60"
                }`}
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{r.title}</div>
                  {r.subtitle && (
                    <div className="truncate text-xs text-muted-foreground">
                      {r.subtitle}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-2 text-[10px] text-muted-foreground">
          <span>
            <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono">
              ↑
            </kbd>{" "}
            <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono">
              ↓
            </kbd>{" "}
            navigate
          </span>
          <span>
            <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono">
              ↵
            </kbd>{" "}
            open
          </span>
          <span>
            <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono">
              Esc
            </kbd>{" "}
            close
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
