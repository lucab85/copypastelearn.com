"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Terminal, Menu, X, Search, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { COURSE_TRACKS } from "@/lib/course-tracks";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AuthButtons } from "./auth-buttons";

const navLinks = [
  { href: "/courses", label: "Courses" },
  { href: "/shop", label: "Shop" },
  { href: "/blog", label: "Blog" },
  { href: "/pricing", label: "Pricing" },
];

/** The "Explore" menu: the catalog tracks, then the Academy and the catalog. */
const exploreTracks = COURSE_TRACKS.filter((t) => t.id !== "OTHER").map((t) => ({
  href: `/courses#${t.anchor}`,
  label: t.title,
  hint: t.tagline,
}));
const exploreMore = [
  { href: "/academy", label: "Agentic AI Academy" },
  { href: "/courses", label: "All courses" },
];

function openSearch() {
  window.dispatchEvent(new CustomEvent("cmdk:open"));
}

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60" role="banner">
      <div className="container mx-auto flex h-16 items-center gap-2 px-4 md:gap-3">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-80">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Terminal className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            CopyPaste<span className="text-primary">Learn</span>
          </span>
        </Link>

        {/* Explore menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="ml-2 hidden h-10 shrink-0 items-center gap-1 rounded-full border px-4 text-sm font-medium outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-accent md:inline-flex">
            Explore
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-80 rounded-xl p-2">
            <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tracks
            </DropdownMenuLabel>
            {exploreTracks.map((item) => (
              <DropdownMenuItem
                key={item.href}
                asChild
                className="cursor-pointer flex-col items-start gap-0.5 rounded-lg px-2 py-2"
              >
                <Link href={item.href}>
                  <span className="font-medium">{item.label}</span>
                  <span className="text-xs text-muted-foreground">{item.hint}</span>
                </Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            {exploreMore.map((item) => (
              <DropdownMenuItem
                key={item.href}
                asChild
                className="cursor-pointer rounded-lg px-2 py-2 font-medium"
              >
                <Link href={item.href}>
                  {item.label}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Search field: opens the search palette */}
        <button
          type="button"
          onClick={openSearch}
          aria-label="Search (Cmd+K)"
          title="Search (⌘K)"
          className="hidden h-10 min-w-0 max-w-md flex-1 items-center gap-2 rounded-full border bg-background px-4 text-sm text-muted-foreground outline-none transition-colors hover:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring md:flex"
        >
          <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">Search articles and topics</span>
          <kbd className="ml-auto hidden rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground xl:inline">
            ⌘K
          </kbd>
        </button>

        {/* Desktop nav */}
        <nav aria-label="Main navigation" className="ml-auto hidden items-center lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                pathname === link.href
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="ml-auto hidden shrink-0 items-center gap-2 md:flex lg:ml-0">
          <AuthButtons />
        </div>

        {/* Mobile search trigger */}
        <button
          type="button"
          onClick={openSearch}
          aria-label="Search"
          className="ml-auto inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground md:hidden"
        >
          <Search className="h-5 w-5" />
        </button>

        {/* Mobile hamburger */}
        <button
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground lg:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t bg-background px-4 pb-4 pt-2 lg:hidden">
          <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent",
                  pathname === link.href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
            <p className="mt-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:hidden">
              Explore
            </p>
            {[...exploreTracks, exploreMore[0]].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent md:hidden"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-2 md:hidden">
            <AuthButtons mobile onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </header>
  );
}
