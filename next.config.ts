import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["local-origin.dev", "*.local-origin.dev"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "i.pinimg.com",
      },
    ],
  },
};

export default nextConfig;
