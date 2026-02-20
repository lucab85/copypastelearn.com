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
    ];
  },
};

export default nextConfig;
