import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Allow HTTPS images from any host to support user-submitted pub images
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
