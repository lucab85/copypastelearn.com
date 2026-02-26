/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@copypastelearn/shared"],
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
      { source: "/blog/:path*", destination: "/blog", permanent: true },
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
};

export default nextConfig;
