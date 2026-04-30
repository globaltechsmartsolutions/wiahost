import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(".");
const reportPath = resolve(root, "quality/reports/release-check.json");
const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

const commands = [
  {
    command: [pnpm, "typecheck"],
    key: "typecheck",
    label: "TypeScript strict",
  },
  {
    command: [pnpm, "lint"],
    key: "lint",
    label: "Lint",
  },
  {
    command: [pnpm, "test"],
    key: "unit_tests",
    label: "Unit tests",
  },
  {
    command: [pnpm, "quality:ci"],
    key: "quality_ci",
    label: "Quality, DB and readiness audits",
  },
  {
    command: [pnpm, "build:web"],
    key: "web_build",
    label: "Web production build",
  },
  {
    command: [pnpm, "build:mobile"],
    key: "mobile_typecheck",
    label: "Mobile typecheck build",
  },
  {
    command: [
      pnpm,
      "--filter",
      "mobile",
      "exec",
      "expo",
      "export:embed",
      "--eager",
      "--platform",
      "android",
      "--dev",
      "false",
    ],
    key: "android_bundle",
    label: "Android bundle export",
  },
  {
    command: [
      pnpm,
      "--filter",
      "mobile",
      "exec",
      "expo",
      "export:embed",
      "--eager",
      "--platform",
      "ios",
      "--dev",
      "false",
    ],
    key: "ios_bundle",
    label: "iOS bundle export",
  },
];

const manualChecks = [
  {
    key: "android_physical_apk",
    label: "Instalar APK preview en Android fisico",
    reason:
      "Requiere dispositivo real para validar permisos, rendimiento percibido y navegacion instalada.",
  },
  {
    key: "mobile_push_permission",
    label: "Registrar push notification en dispositivo fisico",
    reason:
      "Los permisos y ExpoPushToken dependen del sistema operativo y no son fiables en un test headless.",
  },
  {
    key: "mobile_evidence_upload",
    label: "Subir evidencia desde camara, galeria y PDF",
    reason:
      "Camara, galeria y selector de documentos dependen de permisos y proveedores nativos.",
  },
  {
    key: "ios_physical_build",
    label: "Validar iPhone real via TestFlight/EAS preview",
    reason:
      "Apple exige firma con Apple Developer para instalar una app real en iPhone.",
  },
];

function runStep(step) {
  const startedAt = new Date();
  const commandText = step.command.join(" ");
  console.log(`\n▶ ${step.label}`);
  console.log(`$ ${commandText}`);

  const result = spawnSync(commandText, {
    cwd: root,
    env: process.env,
    shell: true,
    stdio: "inherit",
  });

  const finishedAt = new Date();
  const durationMs = finishedAt.getTime() - startedAt.getTime();
  const status = result.status === 0 ? "passed" : "failed";

  return {
    durationMs,
    error: result.error?.message,
    exitCode: result.status ?? 1,
    finishedAt: finishedAt.toISOString(),
    key: step.key,
    label: step.label,
    startedAt: startedAt.toISOString(),
    status,
  };
}

const startedAt = new Date();
const results = [];

for (const step of commands) {
  const result = runStep(step);
  results.push(result);

  if (result.status === "failed") {
    break;
  }
}

const failed = results.find((result) => result.status === "failed");
const finishedAt = new Date();
const report = {
  checkedAt: finishedAt.toISOString(),
  durationMs: finishedAt.getTime() - startedAt.getTime(),
  manualChecks,
  recommendation: failed ? "block_release" : "ready_for_manual_validation",
  results,
  status: failed ? "failed" : "passed",
  summary: failed
    ? `Release check stopped at ${failed.label}.`
    : "Automated release checks passed. Manual physical-device checks remain pending.",
};

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

if (failed) {
  console.error(`\n${report.summary}`);
  console.error(`Report: ${reportPath}`);
  process.exit(1);
}

console.log(`\n${report.summary}`);
console.log(`Report: ${reportPath}`);
