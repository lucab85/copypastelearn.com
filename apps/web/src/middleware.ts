import { NextResponse, type NextRequest } from "next/server";

function isClerkConfigured(): boolean {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!pk || pk.length < 20 || pk.includes("...")) return false;
  try {
    atob(pk.replace(/^pk_(test|live)_/, ""));
    return true;
  } catch {
    return false;
  }
}

export default async function middleware(request: NextRequest) {
  // apex → www redirect (301) for SEO consolidation
  const host = request.headers.get("host") || "";
  if (host && !host.startsWith("www.") && !host.startsWith("localhost")) {
    const url = request.nextUrl.clone();
    url.host = `www.${host}`;
    return NextResponse.redirect(url, 301);
  }

  if (!isClerkConfigured()) {
    return NextResponse.next();
  }

  // Dynamically import Clerk only when configured
  const { clerkMiddleware, createRouteMatcher } = await import(
    "@clerk/nextjs/server"
  );

  const isPublicRoute = createRouteMatcher([
    "/",
    "/about(.*)",
    "/blog(.*)",
    "/contact(.*)",
    "/courses(.*)",
    "/pricing(.*)",
    "/privacy(.*)",
    "/terms(.*)",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/api/webhooks(.*)",
    "/robots.txt",
    "/sitemap.xml",
    "/opengraph-image(.*)",
    // Old site routes (allow redirect to fire before auth check)
    "/learning-paths(.*)",
    "/career-assessment(.*)",
    "/waitlist(.*)",
    "/resources(.*)",
    "/legal(.*)",
  ]);

  return clerkMiddleware(async (auth, req) => {
    if (!isPublicRoute(req)) {
      await auth.protect();
    }
  })(request, {} as never);
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
