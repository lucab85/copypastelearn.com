/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@copypastelearn/shared"],
  outputFileTracingIncludes: {
    "/blog/*": ["./content/blog/**/*"],
    "/feed.xml": ["./content/blog/**/*"],
    "/sitemap.xml": ["./content/blog/**/*"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.mux.com",
      },
    ],
  },

  // 301 redirects — preserve SEO from the old site
  async redirects() {
    return [
      // Old routes that changed path
      {
        source: "/learning-paths",
        destination: "/courses",
        permanent: true,
      },
      {
        source: "/career-assessment",
        destination: "/",
        permanent: true,
      },
      {
        source: "/waitlist",
        destination: "/sign-up",
        permanent: true,
      },
      // /resources/* → best matching pages
      {
        source: "/resources/books",
        destination: "/courses",
        permanent: true,
      },
      {
        source: "/resources/faq",
        destination: "/contact",
        permanent: true,
      },
      {
        source: "/resources/downloads",
        destination: "/courses",
        permanent: true,
      },
      // Catch-all for any other /resources/* pages
      {
        source: "/resources/:path*",
        destination: "/",
        permanent: true,
      },
      // /legal/* → new flat paths
      {
        source: "/legal/privacy",
        destination: "/privacy",
        permanent: true,
      },
      {
        source: "/legal/terms",
        destination: "/terms",
        permanent: true,
      },
      {
        source: "/legal/cookies",
        destination: "/privacy",
        permanent: true,
      },
      {
        source: "/legal/return-policy",
        destination: "/terms",
        permanent: true,
      },
      // Catch-all for any other /legal/* pages
      {
        source: "/legal/:path*",
        destination: "/terms",
        permanent: true,
      },

      // ── Old Hugo site URLs (264 stale 404s in Search Console) ──
      // Blog posts
      { source: "/post/:path*", destination: "/courses", permanent: true },
      // /blog routes are now real pages — no redirect needed
      // Taxonomy pages
      { source: "/tags/:path*", destination: "/courses", permanent: true },
      { source: "/categories/:path*", destination: "/courses", permanent: true },
      // Old sections
      { source: "/scholarship/:path*", destination: "/courses", permanent: true },
      { source: "/author/:path*", destination: "/about", permanent: true },
      { source: "/teacher/:path*", destination: "/about", permanent: true },
      // Old course path (Hugo used /course/, new site uses /courses/)
      { source: "/course", destination: "/courses", permanent: true },
      { source: "/course/:path*", destination: "/courses", permanent: true },
      // Misc old pages
      { source: "/event/:path*", destination: "/", permanent: true },
      { source: "/event", destination: "/", permanent: true },
      { source: "/notice/:path*", destination: "/", permanent: true },
      { source: "/notice", destination: "/", permanent: true },
      { source: "/research", destination: "/courses", permanent: true },
      { source: "/archive/:path*", destination: "/courses", permanent: true },
      // Old paths
      { source: "/paths/:path*", destination: "/courses", permanent: true },
      { source: "/downloads", destination: "/courses", permanent: true },
      { source: "/faq", destination: "/contact", permanent: true },
      // Old Hugo blog posts (no longer exist — redirect to blog listing)
      { source: "/blog/16-ways-to-boost-self-confidence", destination: "/blog", permanent: true },
      { source: "/blog/boost-your-study-motivation-with-the-couch-method", destination: "/blog", permanent: true },
      { source: "/blog/changing-your-life-10-habits-to-transform-your-life", destination: "/blog", permanent: true },
      { source: "/blog/decoding-business-health-unveiling-insights-through-financial-ratios", destination: "/blog", permanent: true },
      { source: "/blog/exploring-google-new-speed-metric-interaction-to-next-paint-inp", destination: "/blog", permanent: true },
      { source: "/blog/exploring-south-asian-association-for-regional-cooperation", destination: "/blog", permanent: true },
      { source: "/blog/how-to-be-more-self-confident-a-simple-and-practical-technique", destination: "/blog", permanent: true },
      { source: "/blog/how-to-study-effectively-and-efficiently-5-infallible-techniques", destination: "/blog", permanent: true },
      { source: "/blog/learning-english-without-studying-a-fun-approach-for-2023", destination: "/blog", permanent: true },
      { source: "/blog/mastering-negotiations-unveiling-batna-zopa-and-the-three-negotiator-archetypes", destination: "/blog", permanent: true },
      { source: "/blog/maximizing-value-unveiling-competitive-advantages-with-value-chain-analysis", destination: "/blog", permanent: true },
      { source: "/blog/memory-techniques-how-to-quickly-memorize-a-200-page-book", destination: "/blog", permanent: true },
      { source: "/blog/navigating-business-strategy-with-the-boston-matrix", destination: "/blog", permanent: true },
      { source: "/blog/navigating-challenges-a-comprehensive-guide-to-issue-analysis-and-the-policy-cycle", destination: "/blog", permanent: true },
      { source: "/blog/navigating-competition-understanding-rivals-with-the-four-corners-model", destination: "/blog", permanent: true },
      { source: "/blog/navigating-success-unveiling-strategic-insights-with-swot-analysis", destination: "/blog", permanent: true },
      { source: "/blog/navigating-the-artful-side-of-finance-where-numbers-dance-and-stories-unfold", destination: "/blog", permanent: true },
      { source: "/blog/navigating-the-business-landscape-unveiling-macro-environments-with-pest-analysis", destination: "/blog", permanent: true },
      { source: "/blog/navigating-the-seas-of-financial-intelligence-demystifying-the-language-of-finance", destination: "/blog", permanent: true },
      { source: "/blog/navigating-uncertainties-the-delphi-method-in-political-risk-analysis", destination: "/blog", permanent: true },
      { source: "/blog/navigating-uncertainty-the-strategic-power-of-scenario-analysis", destination: "/blog", permanent: true },
      { source: "/blog/practical-tips-on-how-to-meditate-and-reap-its-age-old-benefits", destination: "/blog", permanent: true },
      { source: "/blog/procrastination-why-we-do-it-and-how-to-stop", destination: "/blog", permanent: true },
      { source: "/blog/root-cause-analysis-principles-and-benefits", destination: "/blog", permanent: true },
      { source: "/blog/the-wim-hof-method-what-it-is-and-its-benefits", destination: "/blog", permanent: true },
      { source: "/blog/university-study-method-the-fatal-error-of-mediocre-students", destination: "/blog", permanent: true },
      { source: "/blog/unveiling-industry-dynamics-the-power-of-porter-five-forces-model", destination: "/blog", permanent: true },
      // Old RSS feed
      { source: "/index.xml", destination: "/", permanent: true },
      // Trailing-slash variants
      { source: "/about/", destination: "/about", permanent: true },
      { source: "/contact/", destination: "/contact", permanent: true },
      // Junk/bot URLs
      { source: "/beardeddragon/:path*", destination: "/", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.com https://www.googletagmanager.com https://www.clarity.ms https://js.stripe.com https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data: https:; connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://*.google-analytics.com https://*.clarity.ms https://api.stripe.com https://*.mux.com https://*.supabase.co https://app.kit.com; frame-src 'self' https://*.clerk.accounts.dev https://js.stripe.com https://*.mux.com; media-src 'self' https://*.mux.com https://stream.mux.com; worker-src 'self' blob:",
          },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      // Cache static marketing pages at edge (revalidate every 10 min)
      {
        source: "/(about|contact|privacy|terms|pricing)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=600, stale-while-revalidate=86400",
          },
        ],
      },
      // Cache images aggressively
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Cache fonts aggressively
      {
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // Rewrites for IndexNow key verification: /{key}.txt → /api/indexnow
  async rewrites() {
    return [
      {
        source: "/:key([a-f0-9]{32}).txt",
        destination: "/api/indexnow",
      },
    ];
  },
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
