import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@wiahost/shared", "@wiahost/database"]
};

export default nextConfig;
