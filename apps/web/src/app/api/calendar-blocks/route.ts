import { NextResponse } from "next/server";
import { calendarBlockSchema } from "@wiahost/shared";

import { getAuthenticatedApiContext, parseJsonBody } from "@/lib/api/context";
import { apiError, validationError } from "@/lib/api/responses";
import { getCalendarBlocks } from "@/lib/data/calendar";
import {
  CalendarMutationError,
  createCalendarBlock,
} from "@/lib/services/calendar";

export async function GET() {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const blocks = await getCalendarBlocks();
  return NextResponse.json({ data: blocks });
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

  const parsed = calendarBlockSchema.safeParse(json.body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const block = await createCalendarBlock(context.supabase, parsed.data);
    return NextResponse.json({ data: block }, { status: 201 });
  } catch (error) {
    if (error instanceof CalendarMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "calendar_block_create_failed",
      "No se ha podido crear el bloqueo.",
      400,
    );
  }
}
