import { defineConfig } from "vitest/config";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(currentDir, "src"),
    },
  },
  test: {
    environment: "node",
    exclude: [
      "**/.next/**",
      "**/node_modules/**",
      "e2e/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
});
