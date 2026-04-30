import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = resolve(".");
const reportPath = resolve(root, "quality/reports/external-accounts.json");
const where = process.platform === "win32" ? "where.exe" : "which";

function quoteWindowsArg(arg) {
  if (/^[A-Za-z0-9_@%+=:,./\\-]+$/.test(arg)) {
    return arg;
  }

  return `"${arg.replace(/"/g, '\\"')}"`;
}

function pnpmCommand(args) {
  if (process.platform !== "win32") {
    return {
      args,
      command: "pnpm",
    };
  }

  return {
    args: ["/d", "/s", "/c", ["pnpm", ...args].map(quoteWindowsArg).join(" ")],
    command: "cmd.exe",
  };
}

function run(command, args = [], options = {}) {
  try {
    const output = execFileSync(command, args, {
      cwd: root,
      encoding: "utf8",
      env: {
        ...process.env,
        CI: "1",
        NO_COLOR: "1",
      },
      stdio: ["ignore", "pipe", "pipe"],
      timeout: options.timeoutMs ?? 15000,
    });

    return {
      ok: true,
      output: output.trim(),
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message.replace(root, "<repo>")
          : "Command failed",
      ok: false,
      output:
        typeof error?.stdout === "string"
          ? error.stdout.trim()
          : Buffer.isBuffer(error?.stdout)
            ? error.stdout.toString("utf8").trim()
            : "",
      stderr:
        typeof error?.stderr === "string"
          ? error.stderr.trim()
          : Buffer.isBuffer(error?.stderr)
            ? error.stderr.toString("utf8").trim()
            : "",
    };
  }
}

function commandExists(command) {
  return run(where, [command], { timeoutMs: 5000 }).ok;
}

function runPnpm(args, options = {}) {
  const command = pnpmCommand(args);

  return run(command.command, command.args, options);
}

function redact(value) {
  if (!value) {
    return "";
  }

  return value
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "<redacted-email>")
    .replace(/(https?:\/\/)[^@\s]+@/g, "$1<redacted>@")
    .replace(/(sk|pk|whsec|sbp|eyJ)[A-Za-z0-9_\-.]+/g, "<redacted>");
}

function parseEnvFile(path) {
  const absolutePath = resolve(root, path);

  if (!existsSync(absolutePath)) {
    return {
      exists: false,
      keys: [],
      missing: [],
      placeholders: [],
    };
  }

  const entries = readFileSync(absolutePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const [key, ...valueParts] = line.split("=");

      return {
        key: key.trim(),
        value: valueParts.join("=").trim(),
      };
    });

  return {
    exists: true,
    keys: entries.map((entry) => entry.key).sort(),
    placeholders: entries
      .filter((entry) => /replace_with|your_|changeme|todo/i.test(entry.value))
      .map((entry) => entry.key)
      .sort(),
  };
}

function envCheck(path, requiredKeys) {
  const parsed = parseEnvFile(path);

  return {
    ...parsed,
    missing: requiredKeys.filter((key) => !parsed.keys.includes(key)).sort(),
    path,
  };
}

function checkGitRemote() {
  const result = run("git", ["remote", "get-url", "origin"]);

  return {
    name: "GitHub remote",
    requiredFor: "deployments_from_github",
    status: result.ok ? "ready" : "missing",
    summary: result.ok
      ? `Origin configured: ${redact(result.output)}`
      : "No git origin remote was detected.",
  };
}

function checkSupabase() {
  const version = runPnpm(["exec", "supabase", "--version"]);
  const projects = runPnpm(
    ["exec", "supabase", "projects", "list", "--output", "json"],
    { timeoutMs: 20000 },
  );

  return {
    cli: version.ok ? version.output : "not_available",
    name: "Supabase CLI",
    requiredFor: "hosted_database_migrations",
    status: !version.ok ? "missing" : projects.ok ? "ready" : "login_required",
    summary: !version.ok
      ? "Supabase CLI is not available through pnpm."
      : projects.ok
        ? "Supabase CLI is installed and authenticated."
        : "Supabase CLI is installed but login/link is still required.",
  };
}

function checkVercel() {
  const hasVercel = commandExists("vercel");

  if (!hasVercel) {
    return {
      name: "Vercel CLI",
      requiredFor: "manual_local_deploys",
      status: "optional_missing",
      summary:
        "Vercel CLI is not installed globally. The GitHub workflow installs a pinned CLI automatically.",
    };
  }

  const whoami = run("vercel", ["whoami"], { timeoutMs: 10000 });

  return {
    name: "Vercel CLI",
    requiredFor: "manual_local_deploys",
    status: whoami.ok ? "ready" : "login_required",
    summary: whoami.ok
      ? `Logged in as ${redact(whoami.output)}.`
      : "Vercel CLI is installed but not logged in.",
  };
}

function checkEas() {
  const whoami = runPnpm(
    ["--filter", "mobile", "exec", "eas", "whoami", "--non-interactive"],
    { timeoutMs: 20000 },
  );

  return {
    name: "EAS",
    requiredFor: "mobile_builds",
    status: whoami.ok ? "ready" : "login_required",
    summary: whoami.ok
      ? `Logged in as ${redact(whoami.output)}.`
      : "EAS login is required before new cloud mobile builds.",
  };
}

function checkStripeCli() {
  const hasStripe = commandExists("stripe");

  if (!hasStripe) {
    return {
      name: "Stripe CLI",
      requiredFor: "local_webhook_forwarding",
      status: "optional_missing",
      summary:
        "Stripe CLI is not installed. Staging can still use Dashboard webhooks; local webhook forwarding will need the CLI.",
    };
  }

  const version = run("stripe", ["--version"], { timeoutMs: 10000 });

  return {
    name: "Stripe CLI",
    requiredFor: "local_webhook_forwarding",
    status: version.ok ? "available" : "optional_missing",
    summary: version.ok
      ? `Stripe CLI available: ${redact(version.output)}.`
      : "Stripe CLI was found but did not answer.",
  };
}

const envChecks = [
  envCheck("apps/web/.env.local", [
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ]),
  envCheck("apps/mobile/.env", [
    "EXPO_PUBLIC_SUPABASE_URL",
    "EXPO_PUBLIC_SUPABASE_ANON_KEY",
  ]),
];

const checks = [
  checkGitRemote(),
  checkSupabase(),
  checkVercel(),
  checkEas(),
  checkStripeCli(),
];

for (const check of envChecks) {
  checks.push({
    name: `${check.path} environment`,
    requiredFor: check.path.includes("mobile")
      ? "mobile_connected_runtime"
      : "web_connected_runtime",
    status:
      check.exists &&
      check.missing.length === 0 &&
      check.placeholders.length === 0
        ? "ready"
        : "needs_attention",
    summary: !check.exists
      ? `${check.path} does not exist yet.`
      : check.missing.length > 0
        ? `${check.path} is missing ${check.missing.join(", ")}.`
        : check.placeholders.length > 0
          ? `${check.path} still has placeholders for ${check.placeholders.join(", ")}.`
          : `${check.path} contains the required keys without obvious placeholders.`,
  });
}

const blockers = checks.filter((check) =>
  ["missing", "login_required", "needs_attention"].includes(check.status),
);

const report = {
  checkedAt: new Date().toISOString(),
  checks,
  recommendation:
    blockers.length > 0
      ? "complete_external_setup_before_real_staging"
      : "external_setup_ready_for_staging",
  status: blockers.length > 0 ? "needs_attention" : "ready",
  summary:
    blockers.length > 0
      ? `External account preflight found ${blockers.length} item(s) to review.`
      : "External account preflight is ready for staging.",
};

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(`${report.summary} Report: ${reportPath}`);

if (process.argv.includes("--strict") && blockers.length > 0) {
  process.exit(1);
}
