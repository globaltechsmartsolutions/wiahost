import { NextResponse } from "next/server";
import { manualReservationSchema } from "@wiahost/shared";

import { getAuthenticatedApiContext, parseJsonBody } from "@/lib/api/context";
import { apiError, validationError } from "@/lib/api/responses";
import { getReservations } from "@/lib/data/operations";
import { createManualReservation, OperationMutationError } from "@/lib/services/operations";

export async function GET() {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const reservations = await getReservations();
  return NextResponse.json({ data: reservations });
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

  const parsed = manualReservationSchema.safeParse(json.body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const reservation = await createManualReservation(context.supabase, parsed.data);
    return NextResponse.json({ data: reservation }, { status: 201 });
  } catch (error) {
    if (error instanceof OperationMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError("reservation_create_failed", "No se ha podido crear la reserva.", 400);
  }
}
