import { NextResponse } from "next/server";
import { guestSchema } from "@wiahost/shared";
import { z } from "zod";

import { getAuthenticatedApiContext, parseJsonBody } from "@/lib/api/context";
import { apiError, validationError } from "@/lib/api/responses";
import { getGuestDetail } from "@/lib/data/guests";
import { GuestMutationError, updateGuest } from "@/lib/services/guests";

type RouteContext = {
  params: Promise<{ guestId: string }>;
};

const idSchema = z.guid();

async function validGuestId(params: RouteContext["params"]) {
  const { guestId } = await params;
  const validId = idSchema.safeParse(guestId);

  if (!validId.success) {
    return {
      error: apiError(
        "invalid_guest_id",
        "El identificador de huesped no es valido.",
        422,
      ),
    };
  }

  return { guestId: validId.data };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const result = await validGuestId(params);

  if ("error" in result) {
    return result.error;
  }

  const guest = await getGuestDetail(result.guestId);

  if (!guest) {
    return apiError("guest_not_found", "Huesped no encontrado.", 404);
  }

  return NextResponse.json({ data: guest });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const result = await validGuestId(params);

  if ("error" in result) {
    return result.error;
  }

  const json = await parseJsonBody(request);

  if (!json.ok) {
    return json.response;
  }

  const parsed = guestSchema.safeParse(json.body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const guest = await updateGuest(
      context.supabase,
      result.guestId,
      parsed.data,
    );
    return NextResponse.json({ data: guest });
  } catch (error) {
    if (error instanceof GuestMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "guest_update_failed",
      "No se ha podido actualizar el huesped.",
      400,
    );
  }
}
