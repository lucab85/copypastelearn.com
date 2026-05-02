import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/courses(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/pricing(.*)",
  "/api/webhooks(.*)",
  "/api/mobile(.*)",
  "/api/indexnow(.*)",
  "/opengraph-image(.*)",
  "/icon(.*)",
  "/apple-icon(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  /*
   * Only run Clerk middleware on routes that call auth() server-side.
   * Marketing/ISR pages (/, /about, /blog, /contact, /privacy, /terms,
   * /ai-platform-engineering) are EXCLUDED to enable Vercel edge caching.
   *
   * This fixes the LCP regression — Clerk was injecting private,no-cache
   * headers on every marketing page request.
   */
  matcher: [
    // Auth pages
    "/sign-in/:path*",
    "/sign-up/:path*",
    // Pricing (calls auth() to check userId)
    "/pricing/:path*",
    // Course detail & lessons (calls getCurrentUser → auth())
    // Note: /courses listing is excluded (ISR cached, no auth needed)
    "/courses/:slug/:path*",
    // App routes (dashboard, admin — always need auth)
    "/dashboard/:path*",
    "/admin/:path*",
    // API routes
    "/api/:path*",
    // Metadata routes (icons, OG images)
    "/opengraph-image/:path*",
    "/icon/:path*",
    "/apple-icon/:path*",
  ],
};
