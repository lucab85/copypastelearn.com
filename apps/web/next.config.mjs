/** @type {import('next').NextConfig} */
const nextConfig = {
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
