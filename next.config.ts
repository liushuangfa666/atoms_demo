import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  serverExternalPackages: ['esbuild'],
  allowedDevOrigins: ['47.99.210.104'],
};

export default nextConfig;
