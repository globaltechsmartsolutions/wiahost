import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = resolve(".");
const reportPath = resolve(root, "quality/reports/vercel-env-sync.json");
const args = process.argv.slice(2);

function argValue(name, fallback) {
  const prefix = `${name}=`;
  const inline = args.find((arg) => arg.startsWith(prefix));

  if (inline) {
    return inline.slice(prefix.length);
  }

  const index = args.indexOf(name);

  if (index >= 0 && args[index + 1]) {
    return args[index + 1];
  }

  return fallback;
}

const envFile = argValue("--file", ".env.staging.local");
const targetEnvironment = argValue("--environment", "preview");
const allowedEnvironments = new Set(["development", "preview", "production"]);

function fail(message) {
  const report = {
    checkedAt: new Date().toISOString(),
    message,
    status: "failed",
  };

  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.error(`${message} Report: ${reportPath}`);
  process.exit(1);
}

if (!allowedEnvironments.has(targetEnvironment)) {
  fail(
    `Invalid Vercel environment "${targetEnvironment}". Use development, preview or production.`,
  );
}

const absoluteEnvFile = resolve(root, envFile);

if (!existsSync(absoluteEnvFile)) {
  fail(`${envFile} does not exist.`);
}

function parseEnvFile(path) {
  return readFileSync(path, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const [key, ...valueParts] = line.split("=");

      return {
        key: key.trim(),
        value: valueParts.join("=").trim(),
      };
    })
    .filter((entry) => entry.key && entry.value);
}

function isPlaceholder(value) {
  return /replace[_-]with|your_|changeme|todo/i.test(value);
}

function quoteWindowsArg(arg) {
  if (/^[A-Za-z0-9_@%+=:,./\\-]+$/.test(arg)) {
    return arg;
  }

  return `"${arg.replace(/"/g, '\\"')}"`;
}

function runPnpm(args, input) {
  const command =
    process.platform === "win32"
      ? {
          args: [
            "/d",
            "/s",
            "/c",
            ["pnpm", ...args].map(quoteWindowsArg).join(" "),
          ],
          command: "cmd.exe",
        }
      : {
          args,
          command: "pnpm",
        };

  execFileSync(command.command, command.args, {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      CI: "1",
      NO_COLOR: "1",
    },
    input,
    stdio: ["pipe", "pipe", "pipe"],
    timeout: 120000,
  });
}

const deniedKeys = new Set([
  "DATABASE_PASSWORD",
  "SUPABASE_ACCESS_TOKEN",
  "SUPABASE_DB_PASSWORD",
  "SUPABASE_PROJECT_REF",
  "VERCEL_TOKEN",
]);
const publicReadableKeys = new Set([
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
]);
const entries = parseEnvFile(absoluteEnvFile).filter(
  (entry) => !deniedKeys.has(entry.key),
);

if (entries.length === 0) {
  fail(`${envFile} does not contain any syncable variables.`);
}

const placeholderKeys = entries
  .filter((entry) => isPlaceholder(entry.value))
  .map((entry) => entry.key);

if (placeholderKeys.length > 0) {
  fail(
    `${envFile} still has placeholder values for ${placeholderKeys.join(", ")}.`,
  );
}

const synced = [];
const failed = [];

for (const entry of entries) {
  const sensitivityFlag = publicReadableKeys.has(entry.key)
    ? "--no-sensitive"
    : "--sensitive";

  try {
    runPnpm(
      [
        "dlx",
        "vercel@52.2.1",
        "env",
        "add",
        entry.key,
        targetEnvironment,
        "--force",
        "--yes",
        sensitivityFlag,
      ],
      entry.value,
    );
    synced.push(entry.key);
  } catch (error) {
    failed.push({
      key: entry.key,
      message:
        error instanceof Error
          ? error.message.replace(root, "<repo>")
          : "Vercel env sync failed",
    });
  }
}

const report = {
  checkedAt: new Date().toISOString(),
  deniedKeys: [...deniedKeys].filter((key) =>
    parseEnvFile(absoluteEnvFile).some((entry) => entry.key === key),
  ),
  environment: targetEnvironment,
  failed,
  file: envFile,
  status: failed.length > 0 ? "failed" : "passed",
  summary:
    failed.length > 0
      ? `Vercel env sync failed for ${failed.length} key(s).`
      : `Synced ${synced.length} Vercel environment variable(s) without printing values.`,
  synced,
};

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

if (failed.length > 0) {
  console.error(`${report.summary} Report: ${reportPath}`);
  process.exit(1);
}

console.log(`${report.summary} Report: ${reportPath}`);
