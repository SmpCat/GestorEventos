import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  register: true,
});

const nextConfig: NextConfig = {
  serverExternalPackages: [],
  allowedDevOrigins: ['192.168.178.73', '192.168.178.73:3000', '192.168.178.22', '192.168.178.22:3000'],
  experimental: {
    serverActions: {
      allowedOrigins: [
        '192.168.178.73:3000', 
        'localhost:3000', 
        '192.168.178.22:3000',
        'eventos-smp.duckdns.org',
        'smpha.duckdns.org'
      ],
      bodySizeLimit: '20mb',
    },
  },
  output: 'standalone',
  turbopack: {},
};

export default withPWA(nextConfig);
