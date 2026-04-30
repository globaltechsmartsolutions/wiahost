import type { NextConfig } from "next";

import { securityHeaders } from "./security-headers";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  async headers() {
    return [
      {
        headers: [...securityHeaders],
        source: "/:path*",
      },
    ];
  },
  transpilePackages: ["@wiahost/shared", "@wiahost/database"],
};

export default nextConfig;
