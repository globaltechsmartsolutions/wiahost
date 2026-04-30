import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";

const root = resolve(".");
const reportPath = resolve(root, "quality/reports/production-readiness.json");
const securityHeadersPath = resolve(root, "apps/web/security-headers.ts");

const args = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const value = process.argv[index];

  if (value.startsWith("--") && value.includes("=")) {
    const [key, optionValue] = value.slice(2).split("=");
    args.set(key, optionValue);
    continue;
  }

  if (value.startsWith("--")) {
    args.set(value.slice(2), process.argv[index + 1] ?? true);
    index += 1;
  }
}

const mode = args.get("mode") === "production" ? "production" : "local";

const requiredExampleKeys = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
  "EXPO_ACCESS_TOKEN",
  "RESEND_API_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
];

const requiredRuntimeKeys = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const exampleFiles = [".env.example", "apps/web/.env.example"];
const localEnvFiles = ["apps/web/.env.local"];
const secretPatterns = [
  { label: "stripe_live_key", pattern: /sk_live_[A-Za-z0-9]/ },
  { label: "stripe_test_key", pattern: /sk_test_[A-Za-z0-9]/ },
  { label: "supabase_secret_key", pattern: /sb_secret_[A-Za-z0-9]/ },
  { label: "resend_key", pattern: /re_[A-Za-z0-9]{20,}/ },
];

const serverOnlyEnvNames = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "DATABASE_URL",
  "EXPO_ACCESS_TOKEN",
  "RESEND_API_KEY",
];

const allowedServerOnlyFiles = new Set([
  "apps/web/src/lib/health/readiness.ts",
  "apps/web/src/lib/health/readiness.test.ts",
  "apps/web/src/lib/supabase/admin.ts",
  "apps/web/src/lib/stripe/server.ts",
  "apps/web/src/lib/services/push-notifications.ts",
  "apps/web/src/app/api/stripe/webhook/route.ts",
]);

const requiredSecurityHeaders = [
  "X-Frame-Options",
  "X-Content-Type-Options",
  "Referrer-Policy",
  "Permissions-Policy",
  "Strict-Transport-Security",
  "Content-Security-Policy-Report-Only",
];

function readText(path) {
  return readFileSync(path, "utf8");
}

function parseEnvFile(path) {
  const values = {};
  const source = readText(path);

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#") || !line.includes("=")) {
      continue;
    }

    const [key, ...rest] = line.split("=");
    values[key.trim()] = rest
      .join("=")
      .trim()
      .replace(/^["']|["']$/g, "");
  }

  return values;
}

function isPlaceholder(value) {
  return !value || /replace_with|your_|changeme|todo/i.test(value);
}

function isLocalUrl(value) {
  return /localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(value);
}

function addFinding(findings, severity, code, message, target) {
  findings.push({ code, message, severity, target });
}

function listSourceFiles(dir) {
  if (!existsSync(dir)) {
    return [];
  }

  const files = [];
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      if ([".next", "node_modules", "test-results"].includes(entry)) {
        continue;
      }

      files.push(...listSourceFiles(fullPath));
      continue;
    }

    if ([".ts", ".tsx", ".js", ".jsx"].includes(extname(entry))) {
      files.push(fullPath);
    }
  }

  return files;
}

function checkExampleFile(findings, path) {
  if (!existsSync(path)) {
    addFinding(
      findings,
      "critical",
      "missing_env_example",
      "The environment example file is missing.",
      relative(root, path),
    );
    return { exists: false, keys: [] };
  }

  const text = readText(path);
  const values = parseEnvFile(path);
  const keys = Object.keys(values).sort();

  for (const key of requiredExampleKeys) {
    if (!Object.hasOwn(values, key)) {
      addFinding(
        findings,
        "critical",
        "missing_env_example_key",
        `The environment example must document ${key}.`,
        relative(root, path),
      );
    }
  }

  for (const { label, pattern } of secretPatterns) {
    if (pattern.test(text)) {
      addFinding(
        findings,
        "critical",
        "real_secret_in_env_example",
        `The example file appears to contain a real ${label}. Replace it with a placeholder.`,
        relative(root, path),
      );
    }
  }

  return { exists: true, keys };
}

function checkLocalEnvFile(findings, path) {
  if (!existsSync(path)) {
    addFinding(
      findings,
      "medium",
      "missing_local_env",
      "Local development will need this file copied from the example before running the connected app.",
      relative(root, path),
    );
    return { exists: false, configuredKeys: [] };
  }

  const values = parseEnvFile(path);
  const configuredKeys = Object.entries(values)
    .filter(([, value]) => value && !isPlaceholder(value))
    .map(([key]) => key)
    .sort();

  for (const key of requiredRuntimeKeys) {
    if (isPlaceholder(values[key])) {
      addFinding(
        findings,
        "high",
        "local_env_placeholder",
        `Local environment still needs a real value for ${key}.`,
        relative(root, path),
      );
    }
  }

  if (
    values.NEXT_PUBLIC_APP_URL &&
    !values.NEXT_PUBLIC_APP_URL.startsWith("http")
  ) {
    addFinding(
      findings,
      "high",
      "invalid_app_url",
      "NEXT_PUBLIC_APP_URL must be an absolute http(s) URL.",
      relative(root, path),
    );
  }

  if (
    values.NEXT_PUBLIC_APP_URL &&
    isLocalUrl(values.NEXT_PUBLIC_APP_URL) &&
    !values.NEXT_PUBLIC_APP_URL.includes("3002")
  ) {
    addFinding(
      findings,
      "medium",
      "unexpected_local_port",
      "The local app URL should usually point to port 3002 for WIAHost.",
      relative(root, path),
    );
  }

  if (
    values.NEXT_PUBLIC_SUPABASE_URL &&
    !values.NEXT_PUBLIC_SUPABASE_URL.startsWith("http")
  ) {
    addFinding(
      findings,
      "high",
      "invalid_supabase_url",
      "NEXT_PUBLIC_SUPABASE_URL must be an absolute http(s) URL.",
      relative(root, path),
    );
  }

  if (
    values.STRIPE_SECRET_KEY &&
    !isPlaceholder(values.STRIPE_SECRET_KEY) &&
    isPlaceholder(values.STRIPE_WEBHOOK_SECRET)
  ) {
    addFinding(
      findings,
      "high",
      "missing_stripe_webhook_secret",
      "Stripe Checkout is configured but the webhook secret is missing.",
      relative(root, path),
    );
  }

  return { exists: true, configuredKeys };
}

function checkRuntimeEnv(findings) {
  if (mode !== "production") {
    return { checked: false, mode };
  }

  const checkedKeys = {};

  for (const key of requiredRuntimeKeys) {
    const value = process.env[key];
    checkedKeys[key] = Boolean(value && !isPlaceholder(value));

    if (!checkedKeys[key]) {
      addFinding(
        findings,
        "critical",
        "missing_production_env",
        `Production environment requires ${key}.`,
        "process.env",
      );
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (appUrl && (!appUrl.startsWith("https://") || isLocalUrl(appUrl))) {
    addFinding(
      findings,
      "critical",
      "unsafe_production_app_url",
      "Production app URL must use https and must not point to localhost.",
      "process.env",
    );
  }

  if (
    supabaseUrl &&
    (!supabaseUrl.startsWith("https://") || isLocalUrl(supabaseUrl))
  ) {
    addFinding(
      findings,
      "critical",
      "unsafe_production_supabase_url",
      "Production Supabase URL must use https and must not point to localhost.",
      "process.env",
    );
  }

  if (
    process.env.STRIPE_SECRET_KEY &&
    !isPlaceholder(process.env.STRIPE_SECRET_KEY) &&
    isPlaceholder(process.env.STRIPE_WEBHOOK_SECRET)
  ) {
    addFinding(
      findings,
      "critical",
      "missing_production_stripe_webhook_secret",
      "Production Stripe Checkout requires STRIPE_WEBHOOK_SECRET.",
      "process.env",
    );
  }

  return { checked: true, checkedKeys, mode };
}

function checkServerOnlyExposure(findings) {
  const sourceFiles = listSourceFiles(resolve(root, "apps/web/src"));
  const matches = [];

  for (const filePath of sourceFiles) {
    const relativePath = relative(root, filePath).replaceAll("\\", "/");
    const source = readText(filePath);
    const isClientComponent = /^\s*["']use client["']/m.test(source);

    for (const envName of serverOnlyEnvNames) {
      if (!source.includes(envName)) {
        continue;
      }

      matches.push({ envName, path: relativePath });

      if (isClientComponent) {
        addFinding(
          findings,
          "critical",
          "server_secret_in_client_component",
          `${envName} is referenced from a client component.`,
          relativePath,
        );
      }

      if (!allowedServerOnlyFiles.has(relativePath)) {
        addFinding(
          findings,
          "medium",
          "server_secret_reference_review",
          `${envName} is referenced outside the approved server-only config files. Review before production.`,
          relativePath,
        );
      }
    }
  }

  return matches;
}

function checkSecurityHeaders(findings) {
  if (!existsSync(securityHeadersPath)) {
    addFinding(
      findings,
      "critical",
      "missing_security_headers",
      "The web app must keep central security headers configured.",
      relative(root, securityHeadersPath),
    );

    return { exists: false, requiredHeaders: requiredSecurityHeaders };
  }

  const source = readText(securityHeadersPath);
  const missingHeaders = requiredSecurityHeaders.filter(
    (header) => !source.includes(header),
  );

  for (const header of missingHeaders) {
    addFinding(
      findings,
      "high",
      "missing_security_header",
      `Security headers must include ${header}.`,
      relative(root, securityHeadersPath),
    );
  }

  return {
    exists: true,
    missingHeaders,
    requiredHeaders: requiredSecurityHeaders,
  };
}

const findings = [];
const examples = exampleFiles.map((file) =>
  checkExampleFile(findings, resolve(root, file)),
);
const localEnvs = localEnvFiles.map((file) =>
  checkLocalEnvFile(findings, resolve(root, file)),
);
const runtime = checkRuntimeEnv(findings);
const serverOnlyReferences = checkServerOnlyExposure(findings);
const securityHeaders = checkSecurityHeaders(findings);

const blockingSeverities =
  mode === "production" ? ["critical", "high"] : ["critical"];
const blockingFindings = findings.filter((finding) =>
  blockingSeverities.includes(finding.severity),
);

const report = {
  checkedAt: new Date().toISOString(),
  examples,
  findings,
  localEnvs,
  mode,
  recommendation:
    blockingFindings.length > 0
      ? "review_required"
      : findings.length > 0
        ? "proceed_with_follow_up"
        : "ready_for_current_mode",
  riskLevel:
    blockingFindings.length > 0
      ? "high"
      : findings.some((finding) => finding.severity === "high")
        ? "medium"
        : findings.length > 0
          ? "low"
          : "low",
  runtime,
  securityHeaders,
  serverOnlyReferences,
  status: blockingFindings.length > 0 ? "failed" : "passed",
  summary:
    findings.length > 0
      ? `Production readiness found ${findings.length} item(s) to review.`
      : "Production readiness checks passed for the selected mode.",
};

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

if (blockingFindings.length > 0) {
  console.error(
    `${report.summary} Blocking findings: ${blockingFindings.length}. Report: ${reportPath}`,
  );
  process.exit(1);
}

console.log(`${report.summary} Report: ${reportPath}`);
