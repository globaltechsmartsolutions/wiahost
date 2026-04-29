import { NextResponse } from "next/server";
import { updateConversationStatusSchema } from "@wiahost/shared";
import { z } from "zod";

import { getAuthenticatedApiContext, parseJsonBody } from "@/lib/api/context";
import { apiError, validationError } from "@/lib/api/responses";
import {
  OperationMutationError,
  updateConversationStatus,
} from "@/lib/services/operations";

type RouteContext = {
  params: Promise<{ conversationId: string }>;
};

const idSchema = z.guid();

export async function PATCH(request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const { conversationId } = await params;
  const validId = idSchema.safeParse(conversationId);

  if (!validId.success) {
    return apiError(
      "invalid_conversation_id",
      "El identificador de conversacion no es valido.",
      422,
    );
  }

  const json = await parseJsonBody(request);

  if (!json.ok) {
    return json.response;
  }

  const parsed = updateConversationStatusSchema.safeParse(json.body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const conversation = await updateConversationStatus(
      context.supabase,
      validId.data,
      parsed.data.status,
      context.userId,
    );

    return NextResponse.json({ data: conversation });
  } catch (error) {
    if (error instanceof OperationMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "conversation_update_failed",
      "No se ha podido actualizar la conversacion.",
      400,
    );
  }
}
