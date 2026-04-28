import { NextResponse } from "next/server";
import { incidentSchema } from "@wiahost/shared";
import { z } from "zod";

import { getAuthenticatedApiContext, parseJsonBody } from "@/lib/api/context";
import { apiError, validationError } from "@/lib/api/responses";
import { getIncidentDetail } from "@/lib/data/operations";
import {
  OperationMutationError,
  updateIncident,
} from "@/lib/services/operations";

type RouteContext = {
  params: Promise<{ incidentId: string }>;
};

const idSchema = z.guid();

async function validIncidentId(params: RouteContext["params"]) {
  const { incidentId } = await params;
  const validId = idSchema.safeParse(incidentId);

  if (!validId.success) {
    return {
      error: apiError(
        "invalid_incident_id",
        "El identificador de incidencia no es valido.",
        422,
      ),
    };
  }

  return { incidentId: validId.data };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const result = await validIncidentId(params);

  if ("error" in result) {
    return result.error;
  }

  const incident = await getIncidentDetail(result.incidentId);

  if (!incident) {
    return apiError("incident_not_found", "Incidencia no encontrada.", 404);
  }

  return NextResponse.json({ data: incident });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const result = await validIncidentId(params);

  if ("error" in result) {
    return result.error;
  }

  const json = await parseJsonBody(request);

  if (!json.ok) {
    return json.response;
  }

  const parsed = incidentSchema.safeParse(json.body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const incident = await updateIncident(
      context.supabase,
      result.incidentId,
      parsed.data,
    );
    return NextResponse.json({ data: incident });
  } catch (error) {
    if (error instanceof OperationMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "incident_update_failed",
      "No se ha podido actualizar la incidencia.",
      400,
    );
  }
}
