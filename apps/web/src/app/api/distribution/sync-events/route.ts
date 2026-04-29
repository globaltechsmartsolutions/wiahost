import { NextResponse } from "next/server";
import { channelSyncEventSchema } from "@wiahost/shared";

import { getAuthenticatedApiContext, parseJsonBody } from "@/lib/api/context";
import { apiError, validationError } from "@/lib/api/responses";
import { getSyncEvents } from "@/lib/data/distribution";
import {
  createSyncEvent,
  DistributionMutationError,
} from "@/lib/services/distribution";

export async function GET() {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const syncEvents = await getSyncEvents();
  return NextResponse.json({ data: syncEvents });
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

  const parsed = channelSyncEventSchema.safeParse(json.body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const syncEvent = await createSyncEvent(context.supabase, parsed.data);
    return NextResponse.json({ data: syncEvent }, { status: 201 });
  } catch (error) {
    if (error instanceof DistributionMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "sync_event_create_failed",
      "No se ha podido registrar el evento de sincronizacion.",
      400,
    );
  }
}
