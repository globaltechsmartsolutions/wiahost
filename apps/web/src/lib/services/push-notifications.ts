import type { Json } from "@wiahost/database";
import type { NotificationPushInput } from "@wiahost/shared";
import type { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  buildExpoPushMessage,
  ExpoPushRequestError,
  isExpoPushToken,
  sendExpoPushNotifications,
  type ExpoPushMessage,
  type ExpoPushTicket,
} from "@/lib/push/expo";
import { createNotification } from "@/lib/services/notifications";

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

type PushTokenRow = {
  expo_push_token: string;
  id: string;
};

export class PushNotificationMutationError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function mutationError(
  code: string,
  message: string,
  status = 400,
): never {
  throw new PushNotificationMutationError(code, message, status);
}

async function assertOperator(
  supabase: SupabaseServerClient,
  actorUserId: string,
) {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", actorUserId)
    .single();

  if (error || !data) {
    mutationError(
      "profile_not_found",
      "No se ha podido verificar el rol del usuario.",
      403,
    );
  }

  if (!["admin", "operator"].includes(data.role)) {
    mutationError(
      "forbidden",
      "Solo el equipo de operaciones puede enviar push notifications.",
      403,
    );
  }
}

async function getUserPushTokens(
  supabase: SupabaseServerClient,
  profileId: string,
) {
  const { data, error } = await supabase
    .from("mobile_push_tokens")
    .select("id,expo_push_token")
    .eq("profile_id", profileId);

  if (error) {
    mutationError(
      "push_tokens_read_failed",
      "No se han podido leer los dispositivos moviles del usuario.",
    );
  }

  return (data ?? []) as PushTokenRow[];
}

function ticketErrorCode(ticket: ExpoPushTicket | undefined) {
  return ticket?.details?.error ?? (ticket?.status === "error" ? "expo_ticket_error" : null);
}

function deliveryPayload(
  message: ExpoPushMessage | null,
  input: NotificationPushInput,
) {
  return {
    body: input.body?.trim() || null,
    channelId: input.channelId ?? null,
    data: input.data ?? {},
    priority: input.priority,
    title: input.title.trim(),
    type: input.type ?? "system",
    ...(message ? { expo: message } : {}),
  } as Json;
}

async function insertDeliveryRows(
  supabase: SupabaseServerClient,
  rows: Array<{
    error_code?: string | null;
    error_message?: string | null;
    expo_push_token: string;
    expo_ticket_id?: string | null;
    notification_id: string;
    payload: Json;
    profile_id: string;
    status: "ok" | "error" | "skipped";
    token_id?: string | null;
  }>,
) {
  if (!rows.length) {
    return;
  }

  const { error } = await supabase.from("push_notification_deliveries").insert(rows);

  if (error) {
    mutationError(
      "push_delivery_audit_failed",
      "La push se ha procesado, pero no se ha podido guardar su auditoria.",
    );
  }
}

export async function sendMobilePushNotification(
  supabase: SupabaseServerClient,
  actorUserId: string,
  input: NotificationPushInput,
) {
  await assertOperator(supabase, actorUserId);

  const notification = await createNotification(supabase, input.userId, {
    body: input.body,
    title: input.title,
  });

  const tokens = await getUserPushTokens(supabase, input.userId);
  const invalidTokens = tokens.filter(
    (token) => !isExpoPushToken(token.expo_push_token),
  );
  const validTokens = tokens.filter((token) =>
    isExpoPushToken(token.expo_push_token),
  );
  const messages = validTokens.map((token) =>
    buildExpoPushMessage({
      body: input.body,
      channelId: input.channelId,
      data: {
        notificationId: notification.id,
        type: input.type ?? "system",
        ...(input.data ?? {}),
      },
      priority: input.priority,
      title: input.title,
      token: token.expo_push_token,
    }),
  );

  let tickets: ExpoPushTicket[] = [];

  try {
    const result = await sendExpoPushNotifications(messages, {
      accessToken: process.env.EXPO_ACCESS_TOKEN,
    });
    tickets = result.tickets;
  } catch (error) {
    if (error instanceof ExpoPushRequestError) {
      await insertDeliveryRows(
        supabase,
        validTokens.map((token, index) => ({
          error_code: error.code,
          error_message: error.message,
          expo_push_token: token.expo_push_token,
          notification_id: notification.id,
          payload: deliveryPayload(messages[index] ?? null, input),
          profile_id: input.userId,
          status: "error",
          token_id: token.id,
        })),
      );

      mutationError(error.code, error.message, error.status ?? 502);
    }

    throw error;
  }

  const deliveryRows = [
    ...invalidTokens.map((token) => ({
      error_code: "invalid_expo_push_token",
      error_message: "El token registrado no tiene formato ExpoPushToken.",
      expo_push_token: token.expo_push_token,
      notification_id: notification.id,
      payload: deliveryPayload(null, input),
      profile_id: input.userId,
      status: "skipped" as const,
      token_id: token.id,
    })),
    ...validTokens.map((token, index) => {
      const ticket = tickets[index];
      const status: "ok" | "error" =
        ticket?.status === "ok" ? "ok" : "error";

      return {
        error_code: ticketErrorCode(ticket),
        error_message:
          ticket?.status === "error"
            ? ticket.message ?? "Expo ha rechazado esta notificacion."
            : null,
        expo_push_token: token.expo_push_token,
        expo_ticket_id: ticket?.status === "ok" ? ticket.id ?? null : null,
        notification_id: notification.id,
        payload: deliveryPayload(messages[index] ?? null, input),
        profile_id: input.userId,
        status,
        token_id: token.id,
      };
    }),
  ];

  await insertDeliveryRows(supabase, deliveryRows);

  return {
    delivered: deliveryRows.filter((row) => row.status === "ok").length,
    failed: deliveryRows.filter((row) => row.status === "error").length,
    notificationId: notification.id,
    skipped: deliveryRows.filter((row) => row.status === "skipped").length,
    tokens: tokens.length,
  };
}
