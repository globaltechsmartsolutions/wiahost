import { NextResponse } from "next/server";
import { updateIncidentStatusSchema } from "@wiahost/shared";
import { z } from "zod";

import { getAuthenticatedApiContext, parseJsonBody } from "@/lib/api/context";
import { apiError, validationError } from "@/lib/api/responses";
import { OperationMutationError, updateIncidentStatus } from "@/lib/services/operations";

type RouteContext = {
  params: Promise<{ incidentId: string }>;
};

const idSchema = z.guid();

export async function PATCH(request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const { incidentId } = await params;
  const validId = idSchema.safeParse(incidentId);

  if (!validId.success) {
    return apiError("invalid_incident_id", "El identificador de incidencia no es valido.", 422);
  }

  const json = await parseJsonBody(request);

  if (!json.ok) {
    return json.response;
  }

  const parsed = updateIncidentStatusSchema.safeParse(json.body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const incident = await updateIncidentStatus(context.supabase, validId.data, parsed.data.status);
    return NextResponse.json({ data: incident });
  } catch (error) {
    if (error instanceof OperationMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError("incident_update_failed", "No se ha podido actualizar la incidencia.", 400);
  }
}
