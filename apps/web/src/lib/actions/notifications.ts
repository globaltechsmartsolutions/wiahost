"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  markAllNotificationsRead,
  markNotificationRead,
  NotificationMutationError,
} from "@/lib/services/notifications";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const idSchema = z.guid();

function redirectWithError(message: string): never {
  redirect(`/notifications?error=${encodeURIComponent(message)}`);
}

async function requireNotificationClient() {
  if (!isSupabaseConfigured()) {
    redirectWithError("Supabase no esta configurado.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect(
      `/login?error=${encodeURIComponent("Inicia sesion para gestionar notificaciones.")}`,
    );
  }

  return supabase;
}

export async function markNotificationReadAction(formData: FormData) {
  const notificationId = idSchema.safeParse(
    String(formData.get("notificationId") ?? ""),
  );

  if (!notificationId.success) {
    redirectWithError("Notificacion no valida.");
  }

  const supabase = await requireNotificationClient();

  try {
    await markNotificationRead(supabase, notificationId.data);
  } catch (error) {
    if (error instanceof NotificationMutationError) {
      redirectWithError(error.message);
    }

    redirectWithError("No se ha podido marcar la notificacion como leida.");
  }

  revalidatePath("/notifications");
  revalidatePath("/dashboard");
  redirect("/notifications?updated=1");
}

export async function markAllNotificationsReadAction() {
  const supabase = await requireNotificationClient();

  try {
    await markAllNotificationsRead(supabase);
  } catch (error) {
    if (error instanceof NotificationMutationError) {
      redirectWithError(error.message);
    }

    redirectWithError(
      "No se han podido marcar las notificaciones como leidas.",
    );
  }

  revalidatePath("/notifications");
  revalidatePath("/dashboard");
  redirect("/notifications?updated=1");
}
