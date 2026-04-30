import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { logApiError } from "../observability/logger";

function createRequestId() {
  return globalThis.crypto?.randomUUID?.() ?? `req_${Date.now().toString(36)}`;
}

export function apiError(
  code: string,
  message: string,
  status = 400,
  requestId = createRequestId(),
) {
  logApiError({ code, requestId, status });

  return NextResponse.json(
    { error: { code, message, requestId } },
    {
      headers: {
        "X-Request-Id": requestId,
      },
      status,
    },
  );
}

export function validationError(error: ZodError, requestId?: string) {
  const firstIssue = error.issues[0];
  return apiError(
    "validation_error",
    firstIssue?.message ?? "Datos invalidos.",
    422,
    requestId,
  );
}
