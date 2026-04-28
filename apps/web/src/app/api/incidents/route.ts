import { NextResponse } from "next/server";
import { incidentSchema } from "@wiahost/shared";

import { getAuthenticatedApiContext, parseJsonBody } from "@/lib/api/context";
import { apiError, validationError } from "@/lib/api/responses";
import { getIncidents } from "@/lib/data/operations";
import { createIncident, OperationMutationError } from "@/lib/services/operations";

export async function GET() {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const incidents = await getIncidents();
  return NextResponse.json({ data: incidents });
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

  const parsed = incidentSchema.safeParse(json.body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const incident = await createIncident(context.supabase, parsed.data, context.userId);
    return NextResponse.json({ data: incident }, { status: 201 });
  } catch (error) {
    if (error instanceof OperationMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError("incident_create_failed", "No se ha podido crear la incidencia.", 400);
  }
}
