import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function apiError(code: string, message: string, status = 400) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function validationError(error: ZodError) {
  const firstIssue = error.issues[0];
  return apiError("validation_error", firstIssue?.message ?? "Datos invalidos.", 422);
}
