import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@copypastelearn/shared"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.mux.com",
      },
    ],
  },
};

export default nextConfig;
