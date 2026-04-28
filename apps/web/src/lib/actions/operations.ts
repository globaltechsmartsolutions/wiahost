"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  incidentSchema,
  manualReservationSchema,
  messageSchema,
  taskSchema,
  updateIncidentStatusSchema,
  updateReservationStatusSchema,
  updateTaskStatusSchema,
} from "@wiahost/shared";
import { z } from "zod";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const idSchema = z.uuid();

function requiredString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function formPayload(formData: FormData, keys: string[]) {
  return keys.reduce<Record<string, FormDataEntryValue | undefined>>((payload, key) => {
    payload[key] = formData.get(key) ?? undefined;
    return payload;
  }, {});
}

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

async function getMutationContext(path: string) {
  if (!isSupabaseConfigured()) {
    redirectWithError(path, "Supabase no esta configurado. Levanta Supabase local para guardar cambios.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect(`/login?error=${encodeURIComponent("Inicia sesion para modificar la operacion.")}`);
  }

  return { supabase, userId: userData.user.id };
}

function nightsBetween(checkIn: string, checkOut: string) {
  const milliseconds = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(1, Math.round(milliseconds / 86_400_000));
}

function toDatabaseDateTime(value: string | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function createManualReservationAction(formData: FormData) {
  const path = "/reservations";
  const parsed = manualReservationSchema.safeParse(
    formPayload(formData, [
      "propertyId",
      "guestFullName",
      "guestEmail",
      "guestPhone",
      "channel",
      "status",
      "checkIn",
      "checkOut",
      "guestsCount",
      "nightlyRate",
      "cleaningFee",
      "taxesAmount",
      "securityDeposit",
      "notes",
    ]),
  );

  if (!parsed.success) {
    redirectWithError(path, parsed.error.issues[0]?.message ?? "Datos de reserva invalidos.");
  }

  const { supabase } = await getMutationContext(path);

  const { data: guest, error: guestError } = await supabase
    .from("guests")
    .insert({
      email: parsed.data.guestEmail,
      full_name: parsed.data.guestFullName,
      phone: parsed.data.guestPhone,
      preferred_language: "es",
    })
    .select("id")
    .single();

  if (guestError || !guest) {
    redirectWithError(path, "No se ha podido crear el huesped de la reserva.");
  }

  const nights = nightsBetween(parsed.data.checkIn, parsed.data.checkOut);
  const totalAmount = nights * parsed.data.nightlyRate + parsed.data.cleaningFee + parsed.data.taxesAmount;

  const { error } = await supabase.from("reservations").insert({
    channel: parsed.data.channel,
    check_in: parsed.data.checkIn,
    check_out: parsed.data.checkOut,
    cleaning_fee: parsed.data.cleaningFee,
    guest_id: guest.id,
    guests_count: parsed.data.guestsCount,
    nightly_rate: parsed.data.nightlyRate,
    notes: parsed.data.notes,
    payout_amount: totalAmount,
    property_id: parsed.data.propertyId,
    security_deposit: parsed.data.securityDeposit,
    status: parsed.data.status,
    taxes_amount: parsed.data.taxesAmount,
    total_amount: totalAmount,
  });

  if (error) {
    redirectWithError(path, "No se ha podido crear la reserva. Revisa permisos/RLS y disponibilidad.");
  }

  revalidatePath("/reservations");
  revalidatePath("/dashboard");
}

export async function updateReservationStatusAction(formData: FormData) {
  const path = "/reservations";
  const reservationId = idSchema.safeParse(requiredString(formData, "reservationId"));
  const parsed = updateReservationStatusSchema.safeParse({ status: requiredString(formData, "status") });

  if (!reservationId.success || !parsed.success) {
    redirectWithError(path, "Estado de reserva invalido.");
  }

  const { supabase } = await getMutationContext(path);
  const { error } = await supabase.from("reservations").update({ status: parsed.data.status }).eq("id", reservationId.data);

  if (error) {
    redirectWithError(path, "No se ha podido actualizar la reserva.");
  }

  revalidatePath("/reservations");
  revalidatePath("/dashboard");
}

export async function createTaskAction(formData: FormData) {
  const path = "/tasks";
  const parsed = taskSchema.safeParse(
    formPayload(formData, ["propertyId", "reservationId", "title", "description", "type", "status", "dueAt", "priority"]),
  );

  if (!parsed.success) {
    redirectWithError(path, parsed.error.issues[0]?.message ?? "Datos de tarea invalidos.");
  }

  const { supabase, userId } = await getMutationContext(path);
  const { error } = await supabase.from("tasks").insert({
    created_by: userId,
    description: parsed.data.description,
    due_at: toDatabaseDateTime(parsed.data.dueAt),
    priority: parsed.data.priority,
    property_id: parsed.data.propertyId,
    reservation_id: parsed.data.reservationId,
    status: parsed.data.status,
    title: parsed.data.title,
    type: parsed.data.type,
  });

  if (error) {
    redirectWithError(path, "No se ha podido crear la tarea.");
  }

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function updateTaskStatusAction(formData: FormData) {
  const path = "/tasks";
  const taskId = idSchema.safeParse(requiredString(formData, "taskId"));
  const parsed = updateTaskStatusSchema.safeParse({ status: requiredString(formData, "status") });

  if (!taskId.success || !parsed.success) {
    redirectWithError(path, "Estado de tarea invalido.");
  }

  const completedAt = parsed.data.status === "done" ? new Date().toISOString() : null;
  const { supabase } = await getMutationContext(path);
  const { error } = await supabase
    .from("tasks")
    .update({ completed_at: completedAt, status: parsed.data.status })
    .eq("id", taskId.data);

  if (error) {
    redirectWithError(path, "No se ha podido actualizar la tarea.");
  }

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function createIncidentAction(formData: FormData) {
  const path = "/incidents";
  const parsed = incidentSchema.safeParse(
    formPayload(formData, ["propertyId", "reservationId", "title", "description", "severity", "status", "estimatedCost"]),
  );

  if (!parsed.success) {
    redirectWithError(path, parsed.error.issues[0]?.message ?? "Datos de incidencia invalidos.");
  }

  const { supabase, userId } = await getMutationContext(path);
  const { error } = await supabase.from("incidents").insert({
    description: parsed.data.description,
    estimated_cost: parsed.data.estimatedCost,
    property_id: parsed.data.propertyId,
    reported_by: userId,
    reservation_id: parsed.data.reservationId,
    severity: parsed.data.severity,
    status: parsed.data.status,
    title: parsed.data.title,
  });

  if (error) {
    redirectWithError(path, "No se ha podido crear la incidencia.");
  }

  revalidatePath("/incidents");
  revalidatePath("/dashboard");
}

export async function updateIncidentStatusAction(formData: FormData) {
  const path = "/incidents";
  const incidentId = idSchema.safeParse(requiredString(formData, "incidentId"));
  const parsed = updateIncidentStatusSchema.safeParse({ status: requiredString(formData, "status") });

  if (!incidentId.success || !parsed.success) {
    redirectWithError(path, "Estado de incidencia invalido.");
  }

  const resolvedAt = ["resolved", "charged", "cancelled"].includes(parsed.data.status) ? new Date().toISOString() : null;
  const { supabase } = await getMutationContext(path);
  const { error } = await supabase
    .from("incidents")
    .update({ resolved_at: resolvedAt, status: parsed.data.status })
    .eq("id", incidentId.data);

  if (error) {
    redirectWithError(path, "No se ha podido actualizar la incidencia.");
  }

  revalidatePath("/incidents");
  revalidatePath("/dashboard");
}

export async function sendConversationReplyAction(formData: FormData) {
  const path = "/inbox";
  const parsed = messageSchema.safeParse({
    body: requiredString(formData, "body"),
    channel: requiredString(formData, "channel") || "inbox",
    conversationId: requiredString(formData, "conversationId"),
  });

  if (!parsed.success) {
    redirectWithError(path, parsed.error.issues[0]?.message ?? "Mensaje invalido.");
  }

  const { supabase, userId } = await getMutationContext(path);
  const sentAt = new Date().toISOString();
  const { error } = await supabase.from("conversation_messages").insert({
    body: parsed.data.body,
    channel: parsed.data.channel,
    conversation_id: parsed.data.conversationId,
    direction: "outbound",
    sender_profile_id: userId,
    sent_at: sentAt,
  });

  if (error) {
    redirectWithError(path, "No se ha podido enviar el mensaje.");
  }

  await supabase
    .from("conversations")
    .update({ last_message_at: sentAt, status: "pending_guest" })
    .eq("id", parsed.data.conversationId);

  revalidatePath("/inbox");
  revalidatePath("/dashboard");
}
