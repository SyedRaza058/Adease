import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here (translations, themes(dark,light)) */
  experimental: {
    // Allow dev access from LAN devices hitting _next assets
    // Supports common dev ports
    allowedDevOrigins: [
      "http://192.168.0.9:3000",
      "http://192.168.0.9:3001",
      "http://localhost:3000",
      "http://localhost:3001",
    ],
  },
};

export default nextConfig;
