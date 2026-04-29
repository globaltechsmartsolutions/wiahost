import { defineConfig, devices } from "@playwright/test";

const port = process.env.PORT ?? "3002";
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${port}`;
const reportName = (
  process.env.PLAYWRIGHT_REPORT_NAME ??
  process.env.npm_lifecycle_event ??
  "playwright"
).replace(/[^a-z0-9_-]/gi, "-");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  timeout: 75_000,
  // Supabase local and the Next dev server are shared stateful resources.
  // One worker keeps data flows deterministic and avoids blank-page flakes.
  workers: 1,
  reporter: [
    ["list"],
    ["html", { open: "never" }],
    [
      "json",
      { outputFile: `../../quality/reports/playwright/${reportName}.json` },
    ],
  ],
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    video: "retain-on-failure",
  },
  webServer: {
    command: `pnpm exec next dev --port ${port}`,
    env: {
      NEXT_TELEMETRY_DISABLED: "1",
    },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: baseURL,
  },
  projects: [
    {
      name: "chromium-desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { height: 900, width: 1440 },
      },
    },
  ],
});
