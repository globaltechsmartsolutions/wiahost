import { NextResponse } from "next/server";
import { pricingObservationSchema } from "@wiahost/shared";
import { z } from "zod";

import { getAuthenticatedApiContext, parseJsonBody } from "@/lib/api/context";
import { apiError, validationError } from "@/lib/api/responses";
import { getPricingObservationDetail } from "@/lib/data/pricing";
import {
  deletePricingObservation,
  PricingMutationError,
  updatePricingObservation,
} from "@/lib/services/pricing";

type RouteContext = {
  params: Promise<{ observationId: string }>;
};

const idSchema = z.guid();

async function validObservationId(params: RouteContext["params"]) {
  const { observationId } = await params;
  const validId = idSchema.safeParse(observationId);

  if (!validId.success) {
    return {
      error: apiError(
        "invalid_pricing_observation_id",
        "El identificador de precio no es valido.",
        422,
      ),
    };
  }

  return { observationId: validId.data };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const result = await validObservationId(params);

  if ("error" in result) {
    return result.error;
  }

  const observation = await getPricingObservationDetail(result.observationId);

  if (!observation) {
    return apiError(
      "pricing_observation_not_found",
      "Observacion de precio no encontrada.",
      404,
    );
  }

  return NextResponse.json({ data: observation });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const result = await validObservationId(params);

  if ("error" in result) {
    return result.error;
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
    const observation = await updatePricingObservation(
      context.supabase,
      result.observationId,
      parsed.data,
    );
    return NextResponse.json({ data: observation });
  } catch (error) {
    if (error instanceof PricingMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "pricing_observation_update_failed",
      "No se ha podido actualizar la observacion de precio.",
      400,
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const result = await validObservationId(params);

  if ("error" in result) {
    return result.error;
  }

  try {
    const observation = await deletePricingObservation(
      context.supabase,
      result.observationId,
    );
    return NextResponse.json({ data: observation });
  } catch (error) {
    if (error instanceof PricingMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "pricing_observation_delete_failed",
      "No se ha podido eliminar la observacion de precio.",
      400,
    );
  }
}
