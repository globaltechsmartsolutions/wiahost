import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedApiContext } from "@/lib/api/context";
import { apiError } from "@/lib/api/responses";
import {
  PricingMutationError,
  syncPricingObservation,
} from "@/lib/services/pricing";

type RouteContext = {
  params: Promise<{ observationId: string }>;
};

const idSchema = z.guid();

export async function POST(_request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const { observationId } = await params;
  const validObservationId = idSchema.safeParse(observationId);

  if (!validObservationId.success) {
    return apiError(
      "invalid_pricing_observation_id",
      "El identificador de precio no es valido.",
      422,
    );
  }

  try {
    const syncEvent = await syncPricingObservation(
      context.supabase,
      validObservationId.data,
    );
    return NextResponse.json({ data: syncEvent }, { status: 201 });
  } catch (error) {
    if (error instanceof PricingMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "pricing_sync_failed",
      "No se ha podido registrar la sincronizacion de precio.",
      400,
    );
  }
}
