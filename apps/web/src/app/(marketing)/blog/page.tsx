import type { Metadata } from "next";
import { Rss } from "lucide-react";

export const metadata: Metadata = { title: "Blog" };

export default function BlogPage() {
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
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20">
          <Rss className="mb-4 h-10 w-10 text-muted-foreground/50" />
          <p className="text-lg font-medium text-muted-foreground">
            No posts yet.
          </p>
          <p className="mt-1 text-sm text-muted-foreground/70">
            We&apos;re working on our first articles — check back soon!
          </p>
        </div>
      </div>
    </div>
  );
}
