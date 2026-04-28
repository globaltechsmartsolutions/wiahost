import { NextResponse } from "next/server";
import { operationalEventSchema } from "@wiahost/shared";

import { getAuthenticatedApiContext, parseJsonBody } from "@/lib/api/context";
import { apiError, validationError } from "@/lib/api/responses";
import { getAuditEvents } from "@/lib/data/audit-events";
import {
  AuditEventMutationError,
  createAuditEvent,
} from "@/lib/services/audit-events";

export async function GET() {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const events = await getAuditEvents();
  return NextResponse.json({ data: events });
}

export async function POST(request: Request) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const json = await parseJsonBody(request);

  if (!json.ok) {
    return json.response;
  }

  const parsed = operationalEventSchema.safeParse(json.body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const event = await createAuditEvent(
      context.supabase,
      parsed.data,
      context.userId,
    );
    return NextResponse.json({ data: event }, { status: 201 });
  } catch (error) {
    if (error instanceof AuditEventMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "audit_event_create_failed",
      "No se ha podido crear el evento de auditoria.",
      400,
    );
  }
}
