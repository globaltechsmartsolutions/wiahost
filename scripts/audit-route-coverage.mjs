import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const inventoryPath = resolve("quality/audit-memory/route-inventory.json");
const accessibilitySpecPath = resolve("apps/web/e2e/accessibility.spec.ts");
const visualSpecPath = resolve("apps/web/e2e/visual.spec.ts");
const reportPath = resolve("quality/reports/route-coverage.json");

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

  return Array.from(routes);
}

function isCovered(routePath, observedPaths) {
  const routeRegex = routeToRegex(routePath);
  return observedPaths.some((observedPath) => routeRegex.test(observedPath));
}

function uniqueRoutePaths(routes) {
  const seen = new Set();
  const duplicates = new Set();

  for (const route of routes) {
    if (seen.has(route.path)) {
      duplicates.add(route.path);
    }

    seen.add(route.path);
  }

  return Array.from(duplicates);
}

const inventory = JSON.parse(readText(inventoryPath));
const routes = inventory.routes ?? [];
const accessibilityPaths = extractRouteLiterals(
  readText(accessibilitySpecPath),
);
const visualPaths = extractRouteLiterals(readText(visualSpecPath));
const duplicatePaths = uniqueRoutePaths(routes);

const findings = [];

for (const route of routes) {
  if (
    route.tests?.includes("a11y") &&
    !isCovered(route.path, accessibilityPaths)
  ) {
    findings.push({
      path: route.path,
      problem: "missing_a11y_route",
      recommendation: "Add the route to apps/web/e2e/accessibility.spec.ts.",
    });
  }

  if (route.tests?.includes("visual") && !isCovered(route.path, visualPaths)) {
    findings.push({
      path: route.path,
      problem: "missing_visual_route",
      recommendation: "Add the route to apps/web/e2e/visual.spec.ts.",
    });
  }
}

for (const path of duplicatePaths) {
  findings.push({
    path,
    problem: "duplicate_inventory_route",
    recommendation:
      "Keep one canonical entry in quality/audit-memory/route-inventory.json.",
  });
}

const report = {
  checkedAt: new Date().toISOString(),
  counts: {
    accessibilityRoutes: accessibilityPaths.length,
    findings: findings.length,
    inventoryRoutes: routes.length,
    visualRoutes: visualPaths.length,
  },
  findings,
};

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

if (findings.length > 0) {
  console.error(
    `Route coverage audit failed with ${findings.length} finding(s). See ${reportPath}.`,
  );
  process.exit(1);
}

console.log(
  `Route coverage audit passed for ${routes.length} inventory route(s). Report: ${reportPath}`,
);
