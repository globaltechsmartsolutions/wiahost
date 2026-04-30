import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";

import { securityHeaders } from "./security-headers";

const configDir = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(configDir, "../..");

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
  outputFileTracingRoot: workspaceRoot,
  transpilePackages: ["@wiahost/shared", "@wiahost/database"],
  turbopack: {
    root: workspaceRoot,
  },
};

export default nextConfig;
