const port = process.env.LHCI_PORT ?? "3010";
const baseUrl = process.env.LHCI_BASE_URL ?? `http://127.0.0.1:${port}`;

module.exports = {
  ci: {
    collect: {
      startServerCommand: `pnpm --filter web exec next start --port ${port}`,
      startServerReadyPattern: "Ready|Local",
      startServerReadyTimeout: 120000,
      url: [`${baseUrl}/`, `${baseUrl}/login`, `${baseUrl}/register`],
      numberOfRuns: 1,
      settings: {
        preset: "desktop",
        chromeFlags: "--no-sandbox --disable-dev-shm-usage",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.75 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["warn", { minScore: 0.85 }],
        "categories:seo": ["warn", { minScore: 0.85 }],
        "first-contentful-paint": ["warn", { maxNumericValue: 2500 }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 3500 }],
        "cumulative-layout-shift": ["warn", { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "./quality/reports/lighthouse",
    },
  },
};
