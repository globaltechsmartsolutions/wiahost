import type { NotificationInput } from "@wiahost/shared";
import type { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

export class NotificationMutationError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function mutationError(code: string, message: string): never {
  throw new NotificationMutationError(code, message);
}

export async function createNotification(
  supabase: SupabaseServerClient,
  userId: string,
  input: NotificationInput,
) {
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      body: input.body?.trim() || null,
      title: input.title.trim(),
      user_id: userId,
    })
    .select("id,title")
    .single();

  if (error || !data) {
    mutationError(
      "notification_create_failed",
      "No se ha podido crear la notificacion.",
    );
  }

  return data;
}

export async function markNotificationRead(
  supabase: SupabaseServerClient,
  notificationId: string,
) {
  const { data, error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .select("id,read_at")
    .single();

  if (error || !data) {
    mutationError(
      "notification_update_failed",
      "No se ha podido marcar la notificacion como leida.",
    );
  }

  return data;
}

export async function markAllNotificationsRead(supabase: SupabaseServerClient) {
  const { data, error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null)
    .select("id");

  if (error || !data) {
    mutationError(
      "notifications_update_failed",
      "No se han podido marcar las notificaciones como leidas.",
    );
  }

  return data;
}
