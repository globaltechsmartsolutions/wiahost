type LogLevel = "error" | "info" | "warn";

type LogFields = Record<string, boolean | null | number | string | undefined>;

function runtimeContext() {
  return {
    environment: process.env.VERCEL_ENV ?? "local",
    provider: process.env.VERCEL ? "vercel" : "local",
    service: "wiahost-web",
  };
}

function cleanFields(fields: LogFields) {
  return Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined),
  );
}

export function writeStructuredLog(level: LogLevel, fields: LogFields) {
  const entry = {
    ...runtimeContext(),
    ...cleanFields(fields),
    level,
    timestamp: new Date().toISOString(),
  };
  const line = JSON.stringify(entry);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}

export function logApiError(input: {
  code: string;
  requestId: string;
  status: number;
}) {
  if (input.status < 500) {
    return;
  }

  writeStructuredLog("error", {
    code: input.code,
    event: "api_error",
    requestId: input.requestId,
    status: input.status,
  });
}
