import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [],
  allowedDevOrigins: ['192.168.178.73', '192.168.178.73:3000'],
  experimental: {
    serverActions: {
      allowedOrigins: ['192.168.178.73:3000', 'localhost:3000'],
    },
  },
};

export default nextConfig;
