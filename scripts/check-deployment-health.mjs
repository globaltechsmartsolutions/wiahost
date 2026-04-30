import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = resolve(".");
const reportPath = resolve(root, "quality/reports/deployment-health.json");

function readUrlArg() {
  const urlFlagIndex = process.argv.findIndex((arg) => arg === "--url");
  const inlineUrl = process.argv
    .find((arg) => arg.startsWith("--url="))
    ?.slice("--url=".length);

  return (
    inlineUrl ??
    (urlFlagIndex >= 0 ? process.argv[urlFlagIndex + 1] : undefined) ??
    process.env.DEPLOYMENT_URL ??
    process.env.NEXT_PUBLIC_APP_URL
  );
}

function normalizeUrl(rawUrl) {
  if (!rawUrl) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(rawUrl)
    ? rawUrl
    : `https://${rawUrl}`;
  const url = new URL(withProtocol);
  url.pathname = "/api/health";
  url.search = "";
  url.hash = "";

  return url;
}

function createReport(input) {
  return {
    checkedAt: new Date().toISOString(),
    ...input,
  };
}

function writeReport(report) {
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
}

const healthUrl = normalizeUrl(readUrlArg());

if (!healthUrl) {
  const report = createReport({
    finding: "missing_deployment_url",
    recommendation:
      "Pass --url, DEPLOYMENT_URL or NEXT_PUBLIC_APP_URL to check /api/health.",
    status: "failed",
  });

  writeReport(report);
  console.error(`${report.recommendation} Report: ${reportPath}`);
  process.exit(1);
}

let response;
let payload;

try {
  response = await fetch(healthUrl, {
    signal: AbortSignal.timeout(15000),
  });
  payload = await response.json();
} catch (error) {
  const report = createReport({
    deploymentUrl: healthUrl.origin,
    error: error instanceof Error ? error.message : "Unknown fetch error",
    finding: "health_fetch_failed",
    status: "failed",
  });

  writeReport(report);
  console.error(`Deployment health check failed. Report: ${reportPath}`);
  process.exit(1);
}

const checks = Array.isArray(payload.checks) ? payload.checks : [];
const errorChecks = checks.filter((check) => check.status === "error");
const invalidPayload =
  payload.app !== "wiahost" ||
  !["ok", "degraded"].includes(payload.status) ||
  !Array.isArray(payload.checks);

const report = createReport({
  deploymentUrl: healthUrl.origin,
  healthStatus: payload.status ?? "unknown",
  httpStatus: response.status,
  runtime: payload.runtime ?? null,
  status:
    response.ok && !invalidPayload && payload.status === "ok"
      ? "passed"
      : "failed",
  warnings: checks.filter((check) =>
    ["not_configured", "warning"].includes(check.status),
  ),
  errors: errorChecks,
});

if (invalidPayload) {
  report.finding = "invalid_health_payload";
  report.recommendation =
    "The deployment did not return the expected WIAHost health JSON.";
} else if (!response.ok) {
  report.finding = "health_http_failed";
  report.recommendation = "Review deployment logs and /api/health checks.";
} else if (payload.status !== "ok" || errorChecks.length > 0) {
  report.finding = "health_degraded";
  report.recommendation =
    "Fix error checks before considering the deployment ready for demo.";
}

writeReport(report);

if (report.status !== "passed") {
  console.error(`Deployment health check failed. Report: ${reportPath}`);
  process.exit(1);
}

console.log(
  `Deployment health check passed for ${healthUrl.origin}. Report: ${reportPath}`,
);
