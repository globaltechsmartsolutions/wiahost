import { NextResponse } from "next/server";
import { listingSchema } from "@wiahost/shared";

import { getAuthenticatedApiContext, parseJsonBody } from "@/lib/api/context";
import { apiError, validationError } from "@/lib/api/responses";
import { getListings } from "@/lib/data/distribution";
import {
  createListing,
  DistributionMutationError,
} from "@/lib/services/distribution";

export async function GET() {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const listings = await getListings();
  return NextResponse.json({ data: listings });
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

  const parsed = listingSchema.safeParse(json.body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const listing = await createListing(context.supabase, parsed.data);
    return NextResponse.json({ data: listing }, { status: 201 });
  } catch (error) {
    if (error instanceof DistributionMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "listing_create_failed",
      "No se ha podido crear la publicacion.",
      400,
    );
  }
}
