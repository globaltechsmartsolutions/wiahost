import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  transpilePackages: ["@wiahost/shared", "@wiahost/database"],
};

export default nextConfig;
