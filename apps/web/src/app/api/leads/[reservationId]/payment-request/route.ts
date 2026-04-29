import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedApiContext } from "@/lib/api/context";
import { apiError } from "@/lib/api/responses";
import {
  OperationMutationError,
  prepareDirectLeadPayment,
} from "@/lib/services/operations";

type RouteContext = {
  params: Promise<{ reservationId: string }>;
};

const idSchema = z.guid();

export async function POST(_request: Request, { params }: RouteContext) {
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

  try {
    const payment = await prepareDirectLeadPayment(
      context.supabase,
      validReservationId.data,
    );
    return NextResponse.json({ data: payment }, { status: 201 });
  } catch (error) {
    if (error instanceof OperationMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "lead_payment_request_failed",
      "No se ha podido preparar el pago del lead.",
      400,
    );
  }
}
