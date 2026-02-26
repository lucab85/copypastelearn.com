"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

/**
 * Auth-aware buttons that only render Clerk components after mount.
 * During SSG/prerender, Clerk context doesn't exist, so we defer
 * rendering until client-side hydration when ClerkProvider is active.
 */
export function AuthButtons({ mobile, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // During SSR/prerender, show sign-in CTA (safe, no Clerk dependency)
    if (mobile) {
      return (
        <>
          <Button variant="outline" size="sm" asChild>
            <Link href="/sign-in">Sign In</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/sign-up">Get Started</Link>
          </Button>
        </>
      );
    }
    return (
      <>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/sign-in">Sign In</Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/sign-up">Get Started</Link>
        </Button>
      </>
    );
  }

  if (mobile) {
    return (
      <>
        <SignedOut>
          <Button variant="outline" size="sm" asChild>
            <Link href="/sign-in" onClick={onNavigate}>Sign In</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/sign-up" onClick={onNavigate}>Get Started</Link>
          </Button>
        </SignedOut>
        <SignedIn>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard" onClick={onNavigate}>Dashboard</Link>
          </Button>
          <div className="flex items-center gap-2 px-3 py-2">
            <UserButton afterSignOutUrl="/" />
            <span className="text-sm text-muted-foreground">Account</span>
          </div>
        </SignedIn>
      </>
    );
  }

  return (
    <>
      <SignedOut>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/sign-in">Sign In</Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/sign-up">Get Started</Link>
        </Button>
      </SignedOut>
      <SignedIn>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">Dashboard</Link>
        </Button>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </>
  );
}
