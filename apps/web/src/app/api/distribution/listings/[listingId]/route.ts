import { NextResponse } from "next/server";
import { listingSchema } from "@wiahost/shared";
import { z } from "zod";

import { getAuthenticatedApiContext, parseJsonBody } from "@/lib/api/context";
import { apiError, validationError } from "@/lib/api/responses";
import { getListingDetail } from "@/lib/data/distribution";
import {
  deleteListing,
  DistributionMutationError,
  updateListing,
} from "@/lib/services/distribution";

type RouteContext = {
  params: Promise<{ listingId: string }>;
};

const idSchema = z.guid();

async function validListingId(params: RouteContext["params"]) {
  const { listingId } = await params;
  const validId = idSchema.safeParse(listingId);

  if (!validId.success) {
    return {
      error: apiError(
        "invalid_listing_id",
        "El identificador de publicacion no es valido.",
        422,
      ),
    };
  }

  return { listingId: validId.data };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const result = await validListingId(params);

  if ("error" in result) {
    return result.error;
  }

  const listing = await getListingDetail(result.listingId);

  if (!listing) {
    return apiError("listing_not_found", "Publicacion no encontrada.", 404);
  }

  return NextResponse.json({ data: listing });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const result = await validListingId(params);

  if ("error" in result) {
    return result.error;
  }

  const json = await parseJsonBody(request);

  if (!json.ok) {
    return json.response;
  }

  const parsed = listingSchema.safeParse(json.body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const listing = await updateListing(
      context.supabase,
      result.listingId,
      parsed.data,
    );
    return NextResponse.json({ data: listing });
  } catch (error) {
    if (error instanceof DistributionMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "listing_update_failed",
      "No se ha podido actualizar la publicacion.",
      400,
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const result = await validListingId(params);

  if ("error" in result) {
    return result.error;
  }

  try {
    const listing = await deleteListing(context.supabase, result.listingId);
    return NextResponse.json({ data: listing });
  } catch (error) {
    if (error instanceof DistributionMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "listing_delete_failed",
      "No se ha podido eliminar la publicacion.",
      400,
    );
  }
}
