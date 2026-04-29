import { NextResponse } from "next/server";
import { pricingObservationSchema } from "@wiahost/shared";

import { getAuthenticatedApiContext, parseJsonBody } from "@/lib/api/context";
import { apiError, validationError } from "@/lib/api/responses";
import { getPricingObservations } from "@/lib/data/pricing";
import {
  createPricingObservation,
  PricingMutationError,
} from "@/lib/services/pricing";

export async function GET() {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const observations = await getPricingObservations();
  return NextResponse.json({ data: observations });
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

  const parsed = pricingObservationSchema.safeParse(json.body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const observation = await createPricingObservation(
      context.supabase,
      parsed.data,
    );
    return NextResponse.json({ data: observation }, { status: 201 });
  } catch (error) {
    if (error instanceof PricingMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "pricing_observation_create_failed",
      "No se ha podido crear la observacion de precio.",
      400,
    );
  }
}
