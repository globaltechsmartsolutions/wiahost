import { NextResponse } from "next/server";
import { calendarBlockSchema } from "@wiahost/shared";
import { z } from "zod";

import { getAuthenticatedApiContext, parseJsonBody } from "@/lib/api/context";
import { apiError, validationError } from "@/lib/api/responses";
import { getCalendarBlockDetail } from "@/lib/data/calendar";
import {
  CalendarMutationError,
  deleteCalendarBlock,
  updateCalendarBlock,
} from "@/lib/services/calendar";

type RouteContext = {
  params: Promise<{ blockId: string }>;
};

const idSchema = z.guid();

async function validBlockId(params: RouteContext["params"]) {
  const { blockId } = await params;
  const validId = idSchema.safeParse(blockId);

  if (!validId.success) {
    return {
      error: apiError(
        "invalid_calendar_block_id",
        "El identificador de bloqueo no es valido.",
        422,
      ),
    };
  }

  return { blockId: validId.data };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const result = await validBlockId(params);

  if ("error" in result) {
    return result.error;
  }

  const block = await getCalendarBlockDetail(result.blockId);

  if (!block) {
    return apiError("calendar_block_not_found", "Bloqueo no encontrado.", 404);
  }

  return NextResponse.json({ data: block });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const result = await validBlockId(params);

  if ("error" in result) {
    return result.error;
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
    const block = await updateCalendarBlock(
      context.supabase,
      result.blockId,
      parsed.data,
    );
    return NextResponse.json({ data: block });
  } catch (error) {
    if (error instanceof CalendarMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "calendar_block_update_failed",
      "No se ha podido actualizar el bloqueo.",
      400,
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const result = await validBlockId(params);

  if ("error" in result) {
    return result.error;
  }

  try {
    const block = await deleteCalendarBlock(context.supabase, result.blockId);
    return NextResponse.json({ data: block });
  } catch (error) {
    if (error instanceof CalendarMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "calendar_block_delete_failed",
      "No se ha podido eliminar el bloqueo.",
      400,
    );
  }
}
