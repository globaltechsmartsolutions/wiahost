import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = resolve(".");
const reportPath = resolve(root, "quality/reports/vercel-env-deploy.json");
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

function parseEnvFile(path) {
  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const [key, ...valueParts] = line.split("=");

        return [key.trim(), valueParts.join("=").trim()];
      })
      .filter(([key, value]) => key && value),
  );
}

function isPlaceholder(value) {
  return /replace[_-]with|your_|changeme|todo/i.test(value);
}

const envFile = argValue("--file", ".env.staging.local");
const target = argValue("--target", "preview");
const allowedTargets = new Set(["preview", "production"]);

if (!allowedTargets.has(target)) {
  fail(`Invalid Vercel deploy target "${target}". Use preview or production.`);
}

const absoluteEnvFile = resolve(root, envFile);

if (!existsSync(absoluteEnvFile)) {
  fail(`${envFile} does not exist.`);
}

const deniedKeys = new Set([
  "SUPABASE_ACCESS_TOKEN",
  "SUPABASE_DB_PASSWORD",
  "SUPABASE_PROJECT_REF",
  "VERCEL_TOKEN",
]);
const env = parseEnvFile(absoluteEnvFile);
const deployKeys = Object.keys(env).filter(
  (key) => env[key] && !deniedKeys.has(key),
);
const placeholderKeys = deployKeys.filter((key) => isPlaceholder(env[key]));

if (placeholderKeys.length > 0) {
  fail(
    `${envFile} still has placeholder values for ${placeholderKeys.join(", ")}.`,
  );
}

const deployArgs = [
  "dlx",
  "vercel@52.2.1",
  "deploy",
  "--yes",
  "--archive",
  "tgz",
];

if (target === "production") {
  deployArgs.push("--prod");
} else {
  deployArgs.push("--target", target);
}

for (const key of deployKeys) {
  deployArgs.push("--build-env", `${key}=${env[key]}`);
  deployArgs.push("--env", `${key}=${env[key]}`);
}

const result = spawnSync("pnpm", deployArgs, {
  cwd: root,
  encoding: "utf8",
  env: {
    ...process.env,
    CI: "1",
    NO_COLOR: "1",
  },
  shell: process.platform === "win32",
  stdio: ["ignore", "pipe", "pipe"],
  timeout: 600000,
});

const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
const deploymentUrls =
  output.match(/https:\/\/[a-z0-9.-]+\.vercel\.app/g) ?? [];
const url =
  [...deploymentUrls]
    .reverse()
    .find((candidate) => candidate.includes("wiahost-")) ??
  deploymentUrls.at(-1) ??
  null;

const report = {
  checkedAt: new Date().toISOString(),
  deniedKeys: [...deniedKeys].filter((key) => Object.hasOwn(env, key)),
  envFile,
  status: result.status === 0 ? "passed" : "failed",
  syncedKeys: deployKeys,
  target,
  url,
};

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

const redactedOutput = deployKeys.reduce(
  (text, key) => text.replaceAll(env[key], "<redacted-value>"),
  output,
);
process.stdout.write(redactedOutput);

if (result.status !== 0) {
  console.error(`Vercel deployment failed. Report: ${reportPath}`);
  process.exit(result.status ?? 1);
}

console.log(`Vercel deployment completed. Report: ${reportPath}`);
