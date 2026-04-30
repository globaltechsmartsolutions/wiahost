import { NextResponse } from "next/server";
import { channelInboundMessageSchema } from "@wiahost/shared";

import { getAuthenticatedApiContext, parseJsonBody } from "@/lib/api/context";
import { apiError, validationError } from "@/lib/api/responses";
import {
  ingestChannelMessage,
  OperationMutationError,
} from "@/lib/services/operations";

export async function POST(request: Request) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const json = await parseJsonBody(request);

  if (!json.ok) {
    return json.response;
  }

  const parsed = channelInboundMessageSchema.safeParse(json.body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const message = await ingestChannelMessage(
      context.supabase,
      parsed.data,
      context.userId,
    );
    return NextResponse.json({ data: message }, { status: 201 });
  } catch (error) {
    if (error instanceof OperationMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "inbound_message_failed",
      "No se ha podido normalizar el mensaje entrante.",
      400,
    );
  }
}
