"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, Hash, FolderOpen, GraduationCap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  searchAll,
  type SearchIndex,
  type SearchResult,
} from "@/lib/search-index";

const EMPTY_INDEX: SearchIndex = { courses: [], items: [] };

export function CmdKPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<SearchIndex>(EMPTY_INDEX);
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
    // Published courses and blog posts, from a route outside /api so that it
    // also answers for visitors who are not signed in.
    fetch("/search-index.json")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setIndex({ courses: data.courses || [], items: data.items || [] });
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

  const results: SearchResult[] = useMemo(
    () => searchAll(index, query),
    [index, query]
  );

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
            placeholder="Search courses and articles…"
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
                : "Type to search courses, posts, tags, or categories."}
            </p>
          )}
          {results.map((r, i) => {
            const Icon =
              r.type === "course"
                ? GraduationCap
                : r.type === "post"
                  ? FileText
                  : r.type === "tag"
                    ? Hash
                    : FolderOpen;
            // A small heading where the courses start and where they end.
            const group = r.type === "course" ? "Courses" : "Articles";
            const previous = results[i - 1];
            const startsGroup =
              !previous ||
              (previous.type === "course") !== (r.type === "course");
            return (
              <div key={r.href}>
                {startsGroup && (
                  <p className="px-4 pb-1 pt-2 text-xs font-semibold text-muted-foreground">
                    {group}
                  </p>
                )}
                <button
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
                      <div className="truncate text-xs text-foreground/70">
                        {r.subtitle}
                      </div>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
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
