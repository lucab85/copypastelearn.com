import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, BookOpen, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <Search className="h-10 w-10 text-muted-foreground/50" />
      </div>
      <h1 className="text-5xl font-extrabold tracking-tight">404</h1>
      <p className="mt-3 max-w-md text-lg text-muted-foreground">
        This page doesn&apos;t exist. It may have been moved or removed.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/courses">
            <BookOpen className="mr-2 h-4 w-4" />
            Browse Courses
          </Link>
        </Button>
      </div>
      <p className="mt-8 text-sm text-muted-foreground/60">
        Looking for something specific?{" "}
        <Link href="/contact" className="text-primary hover:underline">
          Get in touch
        </Link>
      </p>
    </div>
  );
}
