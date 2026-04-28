import { NextResponse } from "next/server";
import { guestSchema } from "@wiahost/shared";

import { getAuthenticatedApiContext, parseJsonBody } from "@/lib/api/context";
import { apiError, validationError } from "@/lib/api/responses";
import { getGuests } from "@/lib/data/guests";
import { createGuest, GuestMutationError } from "@/lib/services/guests";

export async function GET() {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const guests = await getGuests();
  return NextResponse.json({ data: guests });
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

  const parsed = guestSchema.safeParse(json.body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const guest = await createGuest(context.supabase, parsed.data);
    return NextResponse.json({ data: guest }, { status: 201 });
  } catch (error) {
    if (error instanceof GuestMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "guest_create_failed",
      "No se ha podido crear el huesped.",
      400,
    );
  }
}
