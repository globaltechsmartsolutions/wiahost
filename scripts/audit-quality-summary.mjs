import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";

const require = createRequire(import.meta.url);

const root = resolve(".");
const inventoryPath = resolve(
  root,
  "quality/audit-memory/route-inventory.json",
);
const accessibilitySpecPath = resolve(
  root,
  "apps/web/e2e/accessibility.spec.ts",
);
const visualSpecPath = resolve(root, "apps/web/e2e/visual.spec.ts");
const visualSnapshotPath = resolve(
  root,
  "apps/web/e2e/visual.spec.ts-snapshots",
);
const playwrightReportDir = resolve(root, "quality/reports/playwright");
const productionReadinessPath = resolve(
  root,
  "quality/reports/production-readiness.json",
);
const stagingReadinessPath = resolve(
  root,
  "quality/reports/staging-readiness.json",
);
const databaseSecurityPath = resolve(
  root,
  "quality/reports/database-security.json",
);
const releaseCheckPath = resolve(root, "quality/reports/release-check.json");
const deploymentHealthPath = resolve(
  root,
  "quality/reports/deployment-health.json",
);
const externalAccountsPath = resolve(
  root,
  "quality/reports/external-accounts.json",
);
const lighthouseConfigPath = resolve(root, ".lighthouserc.cjs");
const packageJsonPath = resolve(root, "package.json");
const reportPath = resolve(root, "quality/reports/quality-summary.json");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function readText(path) {
  return readFileSync(path, "utf8");
}

function routeToRegex(routePath) {
  const escaped = routePath
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/:[^/]+/g, "[^/]+");

  return new RegExp(`^${escaped}$`);
}

function concretePath(path) {
  return path.replace(/\$\{seedIds\.[^}]+}/g, "seed-id");
}

function extractRouteLiterals(source) {
  const routes = new Set();
  const patterns = [/"(\/[^"]*)"/g, /'(\/[^']*)'/g, /`(\/[^`]*)`/g];

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const value = match[1];

      if (!value || value.includes("://")) {
        continue;
      }

      routes.add(concretePath(value));
    }
  }

  return Array.from(routes).sort();
}

function isCovered(routePath, observedPaths) {
  const routeRegex = routeToRegex(routePath);
  return observedPaths.some((observedPath) => routeRegex.test(observedPath));
}

function listFiles(path) {
  if (!existsSync(path)) {
    return [];
  }

  return readdirSync(path, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort();
}

function readPlaywrightReports() {
  return listFiles(playwrightReportDir)
    .filter((fileName) => fileName.endsWith(".json"))
    .map((fileName) => {
      const report = readJson(resolve(playwrightReportDir, fileName));
      const stats = report.stats ?? {};
      const unexpected = Number(stats.unexpected ?? 0);
      const flaky = Number(stats.flaky ?? 0);
      const skipped = Number(stats.skipped ?? 0);
      const expected = Number(stats.expected ?? 0);

      return {
        durationMs: Number(stats.duration ?? 0),
        expected,
        fileName,
        flaky,
        skipped,
        status: unexpected > 0 ? "failed" : "passed",
        unexpected,
      };
    });
}

function getChangedFiles() {
  try {
    return execFileSync("git", ["diff", "--name-only", "HEAD"], {
      encoding: "utf8",
    })
      .split(/\r?\n/)
      .filter(Boolean)
      .sort();
  } catch {
    return [];
  }
}

const inventory = readJson(inventoryPath);
const routes = inventory.routes ?? [];
const accessibilityPaths = extractRouteLiterals(
  readText(accessibilitySpecPath),
);
const visualPaths = extractRouteLiterals(readText(visualSpecPath));
const visualSnapshots = listFiles(visualSnapshotPath);
const playwrightReports = readPlaywrightReports();
const rootPackage = readJson(packageJsonPath);
const lighthouseConfig = require(lighthouseConfigPath);
const lighthouseUrls = lighthouseConfig.ci?.collect?.url ?? [];
const lighthouseAssertions = lighthouseConfig.ci?.assert?.assertions ?? {};

const requiredA11yRoutes = routes.filter((route) =>
  route.tests?.includes("a11y"),
);
const requiredVisualRoutes = routes.filter((route) =>
  route.tests?.includes("visual"),
);

const findings = [];

for (const route of requiredA11yRoutes) {
  if (!isCovered(route.path, accessibilityPaths)) {
    findings.push({
      path: route.path,
      problem: "missing_a11y_route",
      recommendation: "Add the route to apps/web/e2e/accessibility.spec.ts.",
      severity: "high",
    });
  }
}

for (const route of requiredVisualRoutes) {
  if (!isCovered(route.path, visualPaths)) {
    findings.push({
      path: route.path,
      problem: "missing_visual_route",
      recommendation: "Add the route to apps/web/e2e/visual.spec.ts.",
      severity: "high",
    });
  }
}

const missingScripts = [
  "typecheck",
  "lint",
  "test",
  "test:e2e",
  "test:a11y",
  "test:visual",
  "quality:routes",
  "quality:db",
  "quality:prod",
  "quality:staging",
  "quality:ci",
  "release:check",
  "check:deployment",
  "accounts:check",
  "build:web",
].filter((scriptName) => !rootPackage.scripts?.[scriptName]);

for (const scriptName of missingScripts) {
  findings.push({
    problem: "missing_quality_script",
    recommendation: `Add package.json script "${scriptName}".`,
    scriptName,
    severity: "medium",
  });
}

const memoryFiles = [
  "accepted-differences.jsonl",
  "known-risks.md",
  "previous-findings.jsonl",
  "product-rules.md",
  "route-inventory.json",
  "visual-baselines.md",
].map((fileName) => ({
  exists: existsSync(resolve(root, "quality/audit-memory", fileName)),
  fileName,
}));

for (const memoryFile of memoryFiles.filter((file) => !file.exists)) {
  findings.push({
    problem: "missing_audit_memory_file",
    recommendation: `Restore quality/audit-memory/${memoryFile.fileName}.`,
    severity: "medium",
  });
}

const blockingFindings = findings.filter((finding) =>
  ["high", "critical"].includes(finding.severity),
);

const report = {
  checkedAt: new Date().toISOString(),
  changedFiles: getChangedFiles(),
  coverage: {
    accessibility: {
      coveredRoutes: requiredA11yRoutes.filter((route) =>
        isCovered(route.path, accessibilityPaths),
      ).length,
      observedRouteLiterals: accessibilityPaths.length,
      requiredRoutes: requiredA11yRoutes.length,
    },
    visual: {
      coveredRoutes: requiredVisualRoutes.filter((route) =>
        isCovered(route.path, visualPaths),
      ).length,
      observedRouteLiterals: visualPaths.length,
      requiredRoutes: requiredVisualRoutes.length,
      snapshotBaselines: visualSnapshots.length,
    },
  },
  findings,
  lighthouse: {
    assertions: Object.keys(lighthouseAssertions).sort(),
    mode: "non_blocking_initial_ci",
    urls: lighthouseUrls,
  },
  memoryFiles,
  playwright: {
    note:
      playwrightReports.length > 0
        ? "Playwright JSON reports detected from recent local or CI runs."
        : "No Playwright JSON reports detected yet. Run test:e2e, test:a11y or test:visual to generate them.",
    reports: playwrightReports,
  },
  productionReadiness: existsSync(productionReadinessPath)
    ? readJson(productionReadinessPath)
    : {
        note: "No production readiness report detected yet. Run pnpm quality:prod to generate it.",
        status: "not_run",
      },
  stagingReadiness: existsSync(stagingReadinessPath)
    ? readJson(stagingReadinessPath)
    : {
        note: "No staging readiness report detected yet. Run pnpm quality:staging to generate it.",
        status: "not_run",
      },
  databaseSecurity: existsSync(databaseSecurityPath)
    ? readJson(databaseSecurityPath)
    : {
        note: "No database security report detected yet. Run pnpm quality:db to generate it.",
        status: "not_run",
      },
  releaseCheck: existsSync(releaseCheckPath)
    ? readJson(releaseCheckPath)
    : {
        note: "No release check report detected yet. Run pnpm release:check to generate it.",
        status: "not_run",
      },
  deploymentHealth: existsSync(deploymentHealthPath)
    ? readJson(deploymentHealthPath)
    : {
        note: "No deployment health report detected yet. Run pnpm check:deployment -- --url <url> after a deploy.",
        status: "not_run",
      },
  externalAccounts: existsSync(externalAccountsPath)
    ? readJson(externalAccountsPath)
    : {
        note: "No external account preflight detected yet. Run pnpm accounts:check before real staging setup.",
        status: "not_run",
      },
  qualityScripts: {
    build: rootPackage.scripts?.["build:web"],
    e2e: rootPackage.scripts?.["test:e2e"],
    lint: rootPackage.scripts?.lint,
    routes: rootPackage.scripts?.["quality:routes"],
    databaseSecurity: rootPackage.scripts?.["quality:db"],
    productionReadiness: rootPackage.scripts?.["quality:prod"],
    stagingReadiness: rootPackage.scripts?.["quality:staging"],
    release: rootPackage.scripts?.["release:check"],
    deploymentHealth: rootPackage.scripts?.["check:deployment"],
    externalAccounts: rootPackage.scripts?.["accounts:check"],
    ci: rootPackage.scripts?.["quality:ci"],
    typecheck: rootPackage.scripts?.typecheck,
    unit: rootPackage.scripts?.test,
    visual: rootPackage.scripts?.["test:visual"],
  },
  recommendation:
    blockingFindings.length > 0 ? "review_required" : "approve_quality_gate",
  riskLevel:
    blockingFindings.length > 0
      ? "high"
      : findings.length > 0
        ? "medium"
        : "low",
  summary:
    findings.length > 0
      ? `Quality summary found ${findings.length} issue(s).`
      : "Quality summary passed with route coverage, audit memory and scripts in place.",
};

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

if (blockingFindings.length > 0) {
  console.error(
    `Quality summary requires review with ${blockingFindings.length} blocking finding(s). See ${reportPath}.`,
  );
  process.exit(1);
}

console.log(`${report.summary} Report: ${reportPath}`);
