import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = resolve(".");
const reportPath = resolve(root, "quality/reports/staging-readiness.json");

const requiredFiles = [
  "docs/DEPLOYMENT.md",
  "docs/RELEASE.md",
  ".vercelignore",
  ".github/workflows/release-check.yml",
  ".github/workflows/vercel-web-deploy.yml",
];

const requiredScripts = [
  "check:deployment",
  "release:check",
  "quality:prod:production",
  "quality:summary",
];

const requiredRuntimeEnvKeys = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "EXPO_ACCESS_TOKEN",
  "RESEND_API_KEY",
];

const requiredDeploymentDocTerms = [
  "Supabase hosted",
  "Vercel",
  "staging",
  "production",
  "/api/health",
  "pnpm release:check",
  "VERCEL_TOKEN",
  "VERCEL_ORG_ID",
  "VERCEL_PROJECT_ID",
  "Root Directory",
  ".vercelignore",
];

function readText(path) {
  return readFileSync(resolve(root, path), "utf8");
}

function readJson(path) {
  return JSON.parse(readText(path));
}

function addFinding(findings, severity, code, message, target) {
  findings.push({ code, message, severity, target });
}

function hasAllTerms(source, terms) {
  return terms.filter((term) => !source.includes(term));
}

function parseEnvKeys(path) {
  if (!existsSync(resolve(root, path))) {
    return [];
  }

  return readText(path)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => line.split("=")[0]?.trim())
    .filter(Boolean)
    .sort();
}

const findings = [];

for (const filePath of requiredFiles) {
  if (!existsSync(resolve(root, filePath))) {
    addFinding(
      findings,
      "critical",
      "missing_staging_file",
      `${filePath} is required for staging readiness.`,
      filePath,
    );
  }
}

const rootPackage = readJson("package.json");
for (const scriptName of requiredScripts) {
  if (!rootPackage.scripts?.[scriptName]) {
    addFinding(
      findings,
      "critical",
      "missing_staging_script",
      `${scriptName} script is required for staging readiness.`,
      "package.json",
    );
  }
}

for (const envFile of [".env.example", "apps/web/.env.example"]) {
  const keys = parseEnvKeys(envFile);

  for (const key of requiredRuntimeEnvKeys) {
    if (!keys.includes(key)) {
      addFinding(
        findings,
        "high",
        "missing_staging_env_example_key",
        `${envFile} must document ${key}.`,
        envFile,
      );
    }
  }
}

if (existsSync(resolve(root, "docs/DEPLOYMENT.md"))) {
  const deploymentDoc = readText("docs/DEPLOYMENT.md");
  const missingTerms = hasAllTerms(deploymentDoc, requiredDeploymentDocTerms);

  for (const term of missingTerms) {
    addFinding(
      findings,
      "medium",
      "deployment_doc_missing_term",
      `Deployment docs should mention ${term}.`,
      "docs/DEPLOYMENT.md",
    );
  }
}

if (existsSync(resolve(root, ".github/workflows/vercel-web-deploy.yml"))) {
  const deployWorkflow = readText(".github/workflows/vercel-web-deploy.yml");
  const workflowTerms = [
    "vercel@52.2.1",
    "pnpm release:check",
    "vercel pull",
    "vercel build",
    "vercel deploy --prebuilt",
    "check-deployment-health.mjs",
    "VERCEL_TOKEN",
  ];
  const missingTerms = hasAllTerms(deployWorkflow, workflowTerms);

  for (const term of missingTerms) {
    addFinding(
      findings,
      "high",
      "vercel_workflow_missing_term",
      `Vercel deploy workflow should include ${term}.`,
      ".github/workflows/vercel-web-deploy.yml",
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
    blockingFindings.length > 0 ? "review_required" : "ready_for_staging_setup",
  requiredFiles,
  requiredRuntimeEnvKeys,
  status: blockingFindings.length > 0 ? "failed" : "passed",
  summary:
    findings.length > 0
      ? `Staging readiness found ${findings.length} item(s).`
      : "Staging readiness checks passed. External accounts and secrets can be connected when available.",
};

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

if (blockingFindings.length > 0) {
  console.error(`${report.summary} Report: ${reportPath}`);
  process.exit(1);
}

console.log(`${report.summary} Report: ${reportPath}`);
