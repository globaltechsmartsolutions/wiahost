import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedApiContext, parseJsonBody } from "@/lib/api/context";
import { apiError, validationError } from "@/lib/api/responses";
import {
  OperationMutationError,
  updateDirectLeadStatus,
} from "@/lib/services/operations";

type RouteContext = {
  params: Promise<{ reservationId: string }>;
};

const idSchema = z.guid();
const leadStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "cancelled"]),
});

export async function PATCH(request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const { reservationId } = await params;
  const validReservationId = idSchema.safeParse(reservationId);

  if (!validReservationId.success) {
    return apiError(
      "invalid_lead_id",
      "El identificador de lead no es valido.",
      422,
    );
  }

  const json = await parseJsonBody(request);

  if (!json.ok) {
    return json.response;
  }

  const parsed = leadStatusSchema.safeParse(json.body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const lead = await updateDirectLeadStatus(
      context.supabase,
      validReservationId.data,
      parsed.data.status,
    );
    return NextResponse.json({ data: lead });
  } catch (error) {
    if (error instanceof OperationMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "lead_status_update_failed",
      "No se ha podido actualizar el lead.",
      400,
    );
  }
}
