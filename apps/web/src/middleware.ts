import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/courses(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/pricing(.*)",
  "/api/webhooks(.*)",
  "/api/mobile(.*)",
  "/api/indexnow(.*)",
  // Guest commerce endpoints — these do their own rate-limiting and
  // validation and intentionally work without a Clerk session. They must
  // NOT be redirected to /sign-in, or fetch() callers receive the sign-in
  // HTML page and fail with "Unexpected token '<' ... is not valid JSON".
  "/api/checkout(.*)",
  "/api/assistant(.*)",
  "/api/agent(.*)",
  "/api/analytics(.*)",
  "/opengraph-image(.*)",
  "/icon(.*)",
  "/apple-icon(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;

  const { userId, redirectToSignIn } = await auth();
  if (!userId) {
    // Redirect unauthenticated visitors to /sign-in instead of returning a 404.
    // This prevents SEO crawlers from flagging gated pages like /library as broken,
    // and gives real users a proper auth flow with returnBackUrl preserved.
    return redirectToSignIn({ returnBackUrl: req.url });
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
    // Library (commerce US2 — buyer access recovery, requires Clerk session)
    "/library/:path*",
    // API routes
    "/api/:path*",
    // Metadata routes (icons, OG images)
    "/opengraph-image/:path*",
    "/icon/:path*",
    "/apple-icon/:path*",
  ],
};
