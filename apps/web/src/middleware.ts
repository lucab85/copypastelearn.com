import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

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
  "/api/mobile(.*)",
  "/robots.txt",
  "/sitemap.xml",
  "/feed.xml",
  "/opengraph-image(.*)",
  // Old site routes (allow redirect to fire before auth check)
  "/learning-paths(.*)",
  "/career-assessment(.*)",
  "/waitlist(.*)",
  "/resources(.*)",
  "/legal(.*)",
  // Old Hugo routes (301 redirects in next.config.mjs)
  "/tags(.*)",
  "/categories(.*)",
  "/scholarship(.*)",
  "/course(.*)",
  "/author(.*)",
  "/teacher(.*)",
  "/event(.*)",
  "/notice(.*)",
  "/research(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
