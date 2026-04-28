import { spawn } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { launch } from "chrome-launcher";

const chromePort = Number(process.env.LHCI_CHROME_PORT ?? 9223);
const profileDir = resolve(".lighthouseci", "chrome-profile");
const command = process.platform === "win32" ? "cmd.exe" : "pnpm";
const args =
  process.platform === "win32"
    ? ["/d", "/s", "/c", "pnpm exec lhci autorun"]
    : ["exec", "lhci", "autorun"];

mkdirSync(profileDir, { recursive: true });

const chrome = await launch({
  port: chromePort,
  userDataDir: profileDir,
  chromeFlags: [
    "--headless=new",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--disable-extensions",
    "--no-first-run",
    "--no-default-browser-check",
  ],
});

const exitCode = await new Promise((resolveExitCode) => {
  const child = spawn(command, args, {
    env: {
      ...process.env,
      LHCI_COLLECT__SETTINGS__PORT: String(chromePort),
    },
    shell: false,
    stdio: "inherit",
  });

  child.on("exit", (code) => resolveExitCode(code ?? 1));
  child.on("error", () => resolveExitCode(1));
});

try {
  chrome.kill();
} finally {
  try {
    rmSync(profileDir, {
      force: true,
      maxRetries: 5,
      recursive: true,
      retryDelay: 500,
    });
  } catch {
    // Windows can keep Chrome profile files locked briefly; the folder is ignored.
  }
}

process.exit(exitCode);
