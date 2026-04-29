import { NextResponse } from "next/server";
import { icalImportSchema } from "@wiahost/shared";

import { getAuthenticatedApiContext, parseJsonBody } from "@/lib/api/context";
import { apiError, validationError } from "@/lib/api/responses";
import {
  DistributionMutationError,
  importIcalBlocks,
} from "@/lib/services/distribution";

export async function POST(request: Request) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const json = await parseJsonBody(request);

  if (!json.ok) {
    return json.response;
  }

  const parsed = icalImportSchema.safeParse(json.body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const result = await importIcalBlocks(context.supabase, parsed.data);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof DistributionMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "ical_import_failed",
      "No se ha podido importar el calendario iCal.",
      400,
    );
  }
}
