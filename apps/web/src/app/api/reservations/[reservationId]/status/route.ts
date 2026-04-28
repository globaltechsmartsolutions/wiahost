import { NextResponse } from "next/server";
import { updateReservationStatusSchema } from "@wiahost/shared";
import { z } from "zod";

import { getAuthenticatedApiContext, parseJsonBody } from "@/lib/api/context";
import { apiError, validationError } from "@/lib/api/responses";
import { OperationMutationError, updateReservationStatus } from "@/lib/services/operations";

type RouteContext = {
  params: Promise<{ reservationId: string }>;
};

const idSchema = z.uuid();

export async function PATCH(request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const { reservationId } = await params;
  const validId = idSchema.safeParse(reservationId);

  if (!validId.success) {
    return apiError("invalid_reservation_id", "El identificador de reserva no es valido.", 422);
  }

  const json = await parseJsonBody(request);

  if (!json.ok) {
    return json.response;
  }

  const parsed = updateReservationStatusSchema.safeParse(json.body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const reservation = await updateReservationStatus(context.supabase, validId.data, parsed.data.status);
    return NextResponse.json({ data: reservation });
  } catch (error) {
    if (error instanceof OperationMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError("reservation_update_failed", "No se ha podido actualizar la reserva.", 400);
  }
}
