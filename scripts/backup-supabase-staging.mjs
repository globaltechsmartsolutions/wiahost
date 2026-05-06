import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";

const root = resolve(".");
const reportPath = resolve(
  root,
  "quality/reports/supabase-staging-backup.json",
);
const backupDir = resolve(root, "supabase/backups");
const shouldApply = process.argv.includes("--apply");
const dataOnly = process.argv.includes("--data-only");
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
const schemas = argValue("--schemas", "public,storage");

function writeReport(report) {
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
}

function fail(message, details = {}) {
  writeReport({
    checkedAt: new Date().toISOString(),
    details,
    message,
    status: "failed",
  });
  console.error(`${message} Report: ${reportPath}`);
  process.exit(1);
}

function parseEnvFile(path) {
  const absolutePath = resolve(root, path);

  if (!existsSync(absolutePath)) {
    return {};
  }

  return Object.fromEntries(
    readFileSync(absolutePath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const [key, ...valueParts] = line.split("=");

        return [key.trim(), valueParts.join("=").trim()];
      }),
  );
}

function required(name, env) {
  const value = (process.env[name] ?? env[name])?.trim();

  if (!value || /replace[_-]with|your_|changeme|todo/i.test(value)) {
    fail(`${name} is required in ${envFile} to backup Supabase staging.`);
  }

  return value;
}

function quoteWindowsArg(arg) {
  if (/^[A-Za-z0-9_@%+=:,./\\-]+$/.test(arg)) {
    return arg;
  }

  return `"${arg.replace(/"/g, '\\"')}"`;
}

function runPnpm(commandArgs, options = {}) {
  const command =
    process.platform === "win32"
      ? {
          args: [
            "/d",
            "/s",
            "/c",
            ["pnpm", ...commandArgs].map(quoteWindowsArg).join(" "),
          ],
          command: "cmd.exe",
        }
      : {
          args: commandArgs,
          command: "pnpm",
        };

  try {
    execFileSync(command.command, command.args, {
      cwd: root,
      encoding: "utf8",
      env: {
        ...process.env,
        CI: "1",
        NO_COLOR: "1",
        ...(options.env ?? {}),
      },
      stdio: "inherit",
      timeout: options.timeoutMs ?? 240000,
    });
  } catch (error) {
    fail("Supabase staging backup command failed.", {
      message:
        error instanceof Error
          ? error.message.replace(root, "<repo>")
          : "Unknown backup error.",
    });
  }
}

const fileEnv = parseEnvFile(envFile);
const projectRef = required("SUPABASE_PROJECT_REF", fileEnv);
const dbPassword = required("SUPABASE_DB_PASSWORD", fileEnv);

if (!shouldApply) {
  const report = {
    applied: false,
    checkedAt: new Date().toISOString(),
    dataOnly,
    projectRef,
    schemas,
    status: "passed",
    summary:
      "Supabase staging backup dry-run completed. Re-run with --apply to create a local ignored dump.",
  };

  writeReport(report);
  console.log(`${report.summary} Report: ${reportPath}`);
  process.exit(0);
}

mkdirSync(backupDir, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupPath = resolve(
  backupDir,
  `${timestamp}-${dataOnly ? "data" : "schema"}-${schemas.replaceAll(",", "-")}.sql`,
);

const commandArgs = [
  "exec",
  "supabase",
  "db",
  "dump",
  "--linked",
  "--schema",
  schemas,
  "--file",
  backupPath,
];

if (dataOnly) {
  commandArgs.push("--data-only", "--use-copy");
}

runPnpm(commandArgs, {
  env: {
    SUPABASE_DB_PASSWORD: dbPassword,
  },
});

const sizeBytes = statSync(backupPath).size;
const report = {
  applied: true,
  backupPath,
  checkedAt: new Date().toISOString(),
  dataOnly,
  projectRef,
  schemas,
  sizeBytes,
  status: "passed",
  summary: "Supabase staging backup created in ignored local backup folder.",
};

writeReport(report);
console.log(`${report.summary} Report: ${reportPath}`);
