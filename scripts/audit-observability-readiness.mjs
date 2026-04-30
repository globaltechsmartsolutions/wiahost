import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = resolve(".");
const reportPath = resolve(
  root,
  "quality/reports/observability-readiness.json",
);

const requiredFiles = [
  "apps/web/src/app/api/health/route.ts",
  "apps/web/src/lib/api/responses.ts",
  "apps/web/src/lib/observability/logger.ts",
  "docs/OBSERVABILITY.md",
];

const sourceChecks = [
  {
    file: "apps/web/src/lib/api/responses.ts",
    terms: ["requestId", "X-Request-Id", "logApiError"],
  },
  {
    file: "apps/web/src/lib/observability/logger.ts",
    terms: ["writeStructuredLog", "logApiError", "api_error", "console.error"],
  },
  {
    file: "docs/OBSERVABILITY.md",
    terms: [
      "/api/health",
      "X-Request-Id",
      "Vercel Runtime Logs",
      "pnpm check:deployment",
    ],
  },
];

function readText(path) {
  return readFileSync(resolve(root, path), "utf8");
}

function addFinding(findings, severity, code, message, target) {
  findings.push({ code, message, severity, target });
}

const findings = [];

for (const file of requiredFiles) {
  if (!existsSync(resolve(root, file))) {
    addFinding(
      findings,
      "critical",
      "missing_observability_file",
      `${file} is required for observability readiness.`,
      file,
    );
  }
}

for (const check of sourceChecks) {
  if (!existsSync(resolve(root, check.file))) {
    continue;
  }

  const source = readText(check.file);

  for (const term of check.terms) {
    if (!source.includes(term)) {
      addFinding(
        findings,
        "high",
        "missing_observability_term",
        `${check.file} should include ${term}.`,
        check.file,
      );
    }
  }
}

const packageJson = JSON.parse(readText("package.json"));

for (const scriptName of ["check:deployment", "quality:observability"]) {
  if (!packageJson.scripts?.[scriptName]) {
    addFinding(
      findings,
      "high",
      "missing_observability_script",
      `package.json should expose ${scriptName}.`,
      "package.json",
    );
  }
}

const blockingFindings = findings.filter((finding) =>
  ["critical", "high"].includes(finding.severity),
);

const report = {
  checkedAt: new Date().toISOString(),
  findings,
  recommendation:
    blockingFindings.length > 0
      ? "review_observability"
      : "observability_ready",
  requiredFiles,
  status: blockingFindings.length > 0 ? "failed" : "passed",
  summary:
    findings.length > 0
      ? `Observability readiness found ${findings.length} item(s).`
      : "Observability readiness checks passed.",
};

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

if (blockingFindings.length > 0) {
  console.error(`${report.summary} Report: ${reportPath}`);
  process.exit(1);
}

console.log(`${report.summary} Report: ${reportPath}`);
