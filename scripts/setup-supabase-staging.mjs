import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = resolve(".");
const reportPath = resolve(root, "quality/reports/supabase-staging.json");
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

function quoteWindowsArg(arg) {
  if (/^[A-Za-z0-9_@%+=:,./\\-]+$/.test(arg)) {
    return arg;
  }

  return `"${arg.replace(/"/g, '\\"')}"`;
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

function isPlaceholder(value) {
  return /replace[_-]with|your_|changeme|todo/i.test(value);
}

function runPnpm(args, options = {}) {
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

  return execFileSync(command.command, command.args, {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      CI: "1",
      NO_COLOR: "1",
      ...(options.env ?? {}),
    },
    stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
    timeout: options.timeoutMs ?? 120000,
  });
}

const fileEnv = parseEnvFile(resolve(root, envFile));
const projectRef = (
  process.env.SUPABASE_PROJECT_REF ?? fileEnv.SUPABASE_PROJECT_REF
)?.trim();
const dbPassword = (
  process.env.SUPABASE_DB_PASSWORD ?? fileEnv.SUPABASE_DB_PASSWORD
)?.trim();

if (!projectRef) {
  fail("SUPABASE_PROJECT_REF is required to link hosted staging.");
}

if (!dbPassword) {
  fail(
    "SUPABASE_DB_PASSWORD is required to link and push hosted staging migrations.",
  );
}

if (isPlaceholder(projectRef) || isPlaceholder(dbPassword)) {
  fail(`${envFile} still contains placeholder Supabase staging values.`);
}

console.log("Linking Supabase staging project...");
runPnpm(["exec", "supabase", "link", "--project-ref", projectRef, "--yes"], {
  env: {
    SUPABASE_DB_PASSWORD: dbPassword,
  },
});

console.log("Checking remote migration plan...");
runPnpm(["exec", "supabase", "db", "push", "--dry-run", "--yes"], {
  env: {
    SUPABASE_DB_PASSWORD: dbPassword,
  },
});

if (shouldApply) {
  console.log("Applying migrations to Supabase staging...");
  runPnpm(["exec", "supabase", "db", "push", "--yes"], {
    env: {
      SUPABASE_DB_PASSWORD: dbPassword,
    },
  });

  console.log("Generating database types from linked staging...");
  const generatedTypes = runPnpm(
    ["exec", "supabase", "gen", "types", "typescript", "--linked"],
    { capture: true },
  );
  writeFileSync(
    resolve(root, "packages/database/src/database.types.ts"),
    generatedTypes,
  );
} else {
  console.log(
    "Dry run only. Re-run with --apply to push migrations and regenerate types.",
  );
}

const report = {
  applied: shouldApply,
  checkedAt: new Date().toISOString(),
  projectRef,
  status: "passed",
  summary: shouldApply
    ? "Supabase staging linked, migrations applied and types regenerated."
    : "Supabase staging link and migration dry-run completed.",
};

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`${report.summary} Report: ${reportPath}`);
