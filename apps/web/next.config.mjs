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
      // Old Hugo blog posts redirect to blog index (but not /blog itself)
      { source: "/blog/:slug+", destination: "/blog", permanent: true },
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
      // Old RSS feed
      { source: "/index.xml", destination: "/", permanent: true },
      // Trailing-slash variants
      { source: "/about/", destination: "/about", permanent: true },
      { source: "/contact/", destination: "/contact", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
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
};

export default nextConfig;
