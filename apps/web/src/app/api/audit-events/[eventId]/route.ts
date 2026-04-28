import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedApiContext } from "@/lib/api/context";
import { apiError } from "@/lib/api/responses";
import { getAuditEventDetail } from "@/lib/data/audit-events";
import {
  AuditEventMutationError,
  deleteAuditEvent,
} from "@/lib/services/audit-events";

type RouteContext = {
  params: Promise<{ eventId: string }>;
};

const idSchema = z.guid();

async function validEventId(params: RouteContext["params"]) {
  const { eventId } = await params;
  const validId = idSchema.safeParse(eventId);

  if (!validId.success) {
    return {
      error: apiError(
        "invalid_audit_event_id",
        "El identificador de evento no es valido.",
        422,
      ),
    };
  }

  return { eventId: validId.data };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const result = await validEventId(params);

  if ("error" in result) {
    return result.error;
  }

  const event = await getAuditEventDetail(result.eventId);

  if (!event) {
    return apiError("audit_event_not_found", "Evento no encontrado.", 404);
  }

  return NextResponse.json({ data: event });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const result = await validEventId(params);

  if ("error" in result) {
    return result.error;
  }

  try {
    const event = await deleteAuditEvent(context.supabase, result.eventId);
    return NextResponse.json({ data: event });
  } catch (error) {
    if (error instanceof AuditEventMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "audit_event_delete_failed",
      "No se ha podido eliminar el evento de auditoria.",
      400,
    );
  }
}
