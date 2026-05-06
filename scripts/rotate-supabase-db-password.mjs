import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = resolve(".");
const reportPath = resolve(root, "quality/reports/supabase-db-rotation.json");
const shouldApply = process.argv.includes("--apply");
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
const absoluteEnvFile = resolve(root, envFile);

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
  if (!existsSync(path)) {
    return {};
  }

  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const [key, ...valueParts] = line.split("=");

        return [key.trim(), valueParts.join("=").trim()];
      }),
  );
}

function setEnvValue(fileContents, key, value) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const line = `${key}=${value}`;

  if (new RegExp(`^${escapedKey}=`, "m").test(fileContents)) {
    return fileContents.replace(new RegExp(`^${escapedKey}=.*$`, "m"), line);
  }

  return `${fileContents.trimEnd()}\n${line}\n`;
}

function isPlaceholder(value) {
  return /replace[_-]with|your_|changeme|todo/i.test(value);
}

function required(name, env) {
  const value = (process.env[name] ?? env[name])?.trim();

  if (!value || isPlaceholder(value)) {
    fail(`${name} is required in ${envFile} to rotate Supabase DB password.`);
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
    const output = execFileSync(command.command, command.args, {
      cwd: root,
      encoding: "utf8",
      env: {
        ...process.env,
        CI: "1",
        NO_COLOR: "1",
        ...(options.env ?? {}),
      },
      stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
      timeout: options.timeoutMs ?? 180000,
    });

    return {
      ok: true,
      output,
    };
  } catch (error) {
    const stderr = Buffer.isBuffer(error?.stderr)
      ? error.stderr.toString("utf8")
      : typeof error?.stderr === "string"
        ? error.stderr
        : "";
    const stdout = Buffer.isBuffer(error?.stdout)
      ? error.stdout.toString("utf8")
      : typeof error?.stdout === "string"
        ? error.stdout
        : "";

    const message = `${stdout}\n${stderr}`.replace(root, "<repo>").trim();

    if (options.allowFailure) {
      return {
        message,
        ok: false,
      };
    }

    fail("Supabase CLI command failed during database password rotation.", {
      message,
    });
  }
}

async function rotateDatabasePassword({ newPassword, projectRef, token }) {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/password`,
    {
      body: JSON.stringify({ password: newPassword }),
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      method: "PATCH",
    },
  );

  if (!response.ok) {
    const body = await response.text();

    fail("Supabase Management API rejected the database password rotation.", {
      body: body.slice(0, 500),
      status: response.status,
    });
  }
}

function buildDatabaseUrl(currentDatabaseUrl, newPassword) {
  try {
    const parsed = new URL(currentDatabaseUrl);
    parsed.password = newPassword;

    return parsed.toString();
  } catch {
    fail("DATABASE_URL is not a valid URL and cannot be updated safely.");
  }
}

if (!existsSync(absoluteEnvFile)) {
  fail(`${envFile} does not exist.`);
}

const fileEnv = parseEnvFile(absoluteEnvFile);
const projectRef = required("SUPABASE_PROJECT_REF", fileEnv);
const currentDatabaseUrl = required("DATABASE_URL", fileEnv);
const newDbPassword = randomBytes(36).toString("base64url");
const nextDatabaseUrl = buildDatabaseUrl(currentDatabaseUrl, newDbPassword);

if (!shouldApply) {
  const report = {
    applied: false,
    checkedAt: new Date().toISOString(),
    projectRef,
    status: "passed",
    summary:
      "Supabase database password rotation dry-run completed. Re-run with --apply.",
    wouldUpdate: ["SUPABASE_DB_PASSWORD", "DATABASE_URL"],
  };

  writeReport(report);
  console.log(`${report.summary} Report: ${reportPath}`);
  process.exit(0);
}

const accessToken = required("SUPABASE_ACCESS_TOKEN", fileEnv);

console.log("Rotating Supabase Postgres password through Management API...");
await rotateDatabasePassword({
  newPassword: newDbPassword,
  projectRef,
  token: accessToken,
});

const currentEnvContents = readFileSync(absoluteEnvFile, "utf8");
const nextEnvContents = setEnvValue(
  setEnvValue(currentEnvContents, "SUPABASE_DB_PASSWORD", newDbPassword),
  "DATABASE_URL",
  nextDatabaseUrl,
);

writeFileSync(absoluteEnvFile, nextEnvContents);

console.log("Verifying new Supabase DB password with seed dry-run...");
let verified = false;
let lastVerificationError = "";

for (let attempt = 1; attempt <= 6; attempt += 1) {
  const verification = runPnpm(["staging:seed"], {
    allowFailure: true,
    env: {
      SUPABASE_DB_PASSWORD: newDbPassword,
    },
    timeoutMs: 240000,
  });

  if (verification.ok) {
    verified = true;
    break;
  }

  lastVerificationError = verification.message;
  console.log(
    `Password not propagated yet; retrying verification (${attempt}/6)...`,
  );
  await new Promise((resolve) => setTimeout(resolve, 15000));
}

if (!verified) {
  fail("New Supabase DB password could not be verified after rotation.", {
    lastVerificationError,
  });
}

const report = {
  applied: true,
  checkedAt: new Date().toISOString(),
  projectRef,
  rotatedKeys: ["SUPABASE_DB_PASSWORD", "DATABASE_URL"],
  status: "passed",
  summary:
    "Supabase database password rotated locally and verified with staging seed dry-run.",
};

writeReport(report);
console.log(`${report.summary} Report: ${reportPath}`);
