import { NextResponse } from "next/server";
import { manualReservationSchema } from "@wiahost/shared";
import { z } from "zod";

import { getAuthenticatedApiContext, parseJsonBody } from "@/lib/api/context";
import { apiError, validationError } from "@/lib/api/responses";
import { getReservationDetail } from "@/lib/data/operations";
import {
  OperationMutationError,
  updateManualReservation,
} from "@/lib/services/operations";

type RouteContext = {
  params: Promise<{ reservationId: string }>;
};

const idSchema = z.guid();

async function validReservationId(params: RouteContext["params"]) {
  const { reservationId } = await params;
  const validId = idSchema.safeParse(reservationId);

  if (!validId.success) {
    return {
      error: apiError(
        "invalid_reservation_id",
        "El identificador de reserva no es valido.",
        422,
      ),
    };
  }

  return { reservationId: validId.data };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const result = await validReservationId(params);

  if ("error" in result) {
    return result.error;
  }

  const reservation = await getReservationDetail(result.reservationId);

  if (!reservation) {
    return apiError("reservation_not_found", "Reserva no encontrada.", 404);
  }

  return NextResponse.json({ data: reservation });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const result = await validReservationId(params);

  if ("error" in result) {
    return result.error;
  }

  const json = await parseJsonBody(request);

  if (!json.ok) {
    return json.response;
  }

  const parsed = manualReservationSchema.safeParse(json.body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const reservation = await updateManualReservation(
      context.supabase,
      result.reservationId,
      parsed.data,
    );
    return NextResponse.json({ data: reservation });
  } catch (error) {
    if (error instanceof OperationMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "reservation_update_failed",
      "No se ha podido actualizar la reserva.",
      400,
    );
  }
}
