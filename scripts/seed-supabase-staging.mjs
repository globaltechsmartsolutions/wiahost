import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = resolve(".");
const reportPath = resolve(root, "quality/reports/supabase-staging-seed.json");
const shouldApply = process.argv.includes("--apply");
const args = process.argv.slice(2);

const demoUsers = [
  "admin@wiahost.local",
  "operaciones@wiahost.local",
  "owner@wiahost.local",
  "limpieza@wiahost.local",
];

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

function required(name, env) {
  const value = (process.env[name] ?? env[name])?.trim();

  if (!value || isPlaceholder(value)) {
    fail(`${name} is required in ${envFile} to seed Supabase staging.`);
  }

  return value;
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
    timeout: options.timeoutMs ?? 180000,
  });
}

const fileEnv = parseEnvFile(resolve(root, envFile));
const projectRef = required("SUPABASE_PROJECT_REF", fileEnv);
const dbPassword = required("SUPABASE_DB_PASSWORD", fileEnv);
const supabaseUrl = required("NEXT_PUBLIC_SUPABASE_URL", fileEnv);
const anonKey = required("NEXT_PUBLIC_SUPABASE_ANON_KEY", fileEnv);
const serviceRoleKey = required("SUPABASE_SERVICE_ROLE_KEY", fileEnv);

console.log("Linking Supabase staging project...");
runPnpm(["exec", "supabase", "link", "--project-ref", projectRef, "--yes"], {
  env: {
    SUPABASE_DB_PASSWORD: dbPassword,
  },
});

console.log(
  shouldApply
    ? "Applying idempotent demo seed to Supabase staging..."
    : "Checking seed command against Supabase staging...",
);
runPnpm(
  [
    "exec",
    "supabase",
    "db",
    "push",
    "--include-seed",
    "--yes",
    ...(shouldApply ? [] : ["--dry-run"]),
  ],
  {
    env: {
      SUPABASE_DB_PASSWORD: dbPassword,
    },
  },
);

if (!shouldApply) {
  const report = {
    applied: false,
    checkedAt: new Date().toISOString(),
    projectRef,
    status: "passed",
    summary: "Supabase staging seed dry-run completed. Re-run with --apply.",
  };

  writeReport(report);
  console.log(`${report.summary} Report: ${reportPath}`);
  process.exit(0);
}

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
const publicClient = createClient(supabaseUrl, anonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const { data: usersData, error: usersError } =
  await adminClient.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });

if (usersError) {
  fail("Could not verify Supabase Auth demo users.", {
    code: usersError.status,
  });
}

const hostedEmails = new Set(usersData.users.map((user) => user.email));
const missingUsers = demoUsers.filter((email) => !hostedEmails.has(email));

if (missingUsers.length > 0) {
  fail("Supabase staging demo users are missing after seed.", {
    missingUsers,
  });
}

const tableChecks = [
  ["properties", 2],
  ["reservations", 2],
  ["conversations", 1],
  ["tasks", 2],
  ["incidents", 1],
  ["payments", 2],
  ["automation_rules", 2],
  ["channel_accounts", 4],
];
const counts = {};

for (const [table, minimum] of tableChecks) {
  const { count, error } = await adminClient
    .from(table)
    .select("id", { count: "exact", head: true });

  if (error) {
    fail(`Could not verify ${table} demo data.`, {
      code: error.code,
      table,
    });
  }

  counts[table] = count ?? 0;

  if ((count ?? 0) < minimum) {
    fail(`${table} has fewer demo rows than expected.`, {
      count,
      minimum,
      table,
    });
  }
}

const { error: signInError } = await publicClient.auth.signInWithPassword({
  email: "operaciones@wiahost.local",
  password: "Password123!",
});

if (signInError) {
  fail("Demo operator login failed after seed.", {
    code: signInError.status,
  });
}

const report = {
  applied: true,
  checkedAt: new Date().toISOString(),
  counts,
  demoUsers,
  projectRef,
  signInVerified: true,
  status: "passed",
  summary: "Supabase staging seeded and verified with demo login.",
};

writeReport(report);
console.log(`${report.summary} Report: ${reportPath}`);
