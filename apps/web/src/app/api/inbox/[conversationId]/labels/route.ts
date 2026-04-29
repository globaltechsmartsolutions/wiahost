import { NextResponse } from "next/server";
import { messageLabelSchema } from "@wiahost/shared";
import { z } from "zod";

import { getAuthenticatedApiContext, parseJsonBody } from "@/lib/api/context";
import { apiError, validationError } from "@/lib/api/responses";
import {
  createConversationMessageLabel,
  OperationMutationError,
} from "@/lib/services/operations";

type RouteContext = {
  params: Promise<{ conversationId: string }>;
};

const idSchema = z.guid();

export async function POST(request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const { conversationId } = await params;
  const validConversationId = idSchema.safeParse(conversationId);

  if (!validConversationId.success) {
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

  const body =
    typeof json.body === "object" && json.body !== null
      ? (json.body as Record<string, unknown>)
      : {};
  const metadata =
    typeof body.metadata === "object" && body.metadata !== null
      ? (body.metadata as Record<string, unknown>)
      : {};
  const parsed = messageLabelSchema.safeParse({
    ...body,
    conversationId: validConversationId.data,
    metadata: {
      ...metadata,
      capture: "api",
    },
    source: "human",
  });

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const label = await createConversationMessageLabel(
      context.supabase,
      parsed.data,
      context.userId,
    );
    return NextResponse.json({ data: label }, { status: 201 });
  } catch (error) {
    if (error instanceof OperationMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "message_label_create_failed",
      "No se ha podido guardar la etiqueta del hilo.",
      400,
    );
  }
}
