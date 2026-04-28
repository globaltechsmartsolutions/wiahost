import { NextResponse } from "next/server";
import { messageSchema } from "@wiahost/shared";
import { z } from "zod";

import { getAuthenticatedApiContext, parseJsonBody } from "@/lib/api/context";
import { apiError, validationError } from "@/lib/api/responses";
import { OperationMutationError, sendConversationReply } from "@/lib/services/operations";

type RouteContext = {
  params: Promise<{ conversationId: string }>;
};

const idSchema = z.uuid();

export async function GET(_: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const { conversationId } = await params;
  const validId = idSchema.safeParse(conversationId);

  if (!validId.success) {
    return apiError("invalid_conversation_id", "El identificador de conversacion no es valido.", 422);
  }

  const { data, error } = await context.supabase
    .from("conversation_messages")
    .select("id,conversation_id,channel,direction,body,sent_at,read_at")
    .eq("conversation_id", validId.data)
    .order("sent_at", { ascending: true });

  if (error) {
    return apiError("messages_fetch_failed", "No se han podido cargar los mensajes.", 400);
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const { conversationId } = await params;
  const validId = idSchema.safeParse(conversationId);

  if (!validId.success) {
    return apiError("invalid_conversation_id", "El identificador de conversacion no es valido.", 422);
  }

  const json = await parseJsonBody(request);

  if (!json.ok) {
    return json.response;
  }

  const parsed = messageSchema.safeParse({
    ...json.body,
    conversationId: validId.data,
  });

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const message = await sendConversationReply(context.supabase, parsed.data, context.userId);
    return NextResponse.json({ data: message }, { status: 201 });
  } catch (error) {
    if (error instanceof OperationMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError("message_send_failed", "No se ha podido enviar el mensaje.", 400);
  }
}
