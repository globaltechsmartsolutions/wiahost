import type {
  IncidentInput,
  ManualReservationInput,
  MessageInput,
  TaskInput,
} from "@wiahost/shared";
import type { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

export class OperationMutationError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function mutationError(code: string, message: string): never {
  throw new OperationMutationError(code, message);
}

function nightsBetween(checkIn: string, checkOut: string) {
  const milliseconds =
    new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(1, Math.round(milliseconds / 86_400_000));
}

function toDatabaseDateTime(value: string | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function createManualReservation(
  supabase: SupabaseServerClient,
  input: ManualReservationInput,
) {
  const { data: guest, error: guestError } = await supabase
    .from("guests")
    .insert({
      email: input.guestEmail ?? null,
      full_name: input.guestFullName,
      phone: input.guestPhone ?? null,
      preferred_language: "es",
    })
    .select("id")
    .single();

  if (guestError || !guest) {
    mutationError(
      "guest_create_failed",
      "No se ha podido crear el huesped de la reserva.",
    );
  }

  const nights = nightsBetween(input.checkIn, input.checkOut);
  const totalAmount =
    nights * input.nightlyRate + input.cleaningFee + input.taxesAmount;

  const { data, error } = await supabase
    .from("reservations")
    .insert({
      channel: input.channel,
      check_in: input.checkIn,
      check_out: input.checkOut,
      cleaning_fee: input.cleaningFee,
      guest_id: guest.id,
      guests_count: input.guestsCount,
      nightly_rate: input.nightlyRate,
      notes: input.notes ?? null,
      payout_amount: totalAmount,
      property_id: input.propertyId,
      security_deposit: input.securityDeposit,
      status: input.status,
      taxes_amount: input.taxesAmount,
      total_amount: totalAmount,
    })
    .select("id,status,total_amount")
    .single();

  if (error || !data) {
    mutationError(
      "reservation_create_failed",
      "No se ha podido crear la reserva. Revisa permisos/RLS y disponibilidad.",
    );
  }

  return data;
}

export async function updateReservationStatus(
  supabase: SupabaseServerClient,
  reservationId: string,
  status: string,
) {
  const { data, error } = await supabase
    .from("reservations")
    .update({ status })
    .eq("id", reservationId)
    .select("id,status")
    .single();

  if (error || !data) {
    mutationError(
      "reservation_update_failed",
      "No se ha podido actualizar la reserva.",
    );
  }

  return data;
}

export async function updateDirectLeadStatus(
  supabase: SupabaseServerClient,
  reservationId: string,
  status: "pending" | "confirmed" | "cancelled",
) {
  const { data, error } = await supabase
    .from("reservations")
    .update({ status })
    .eq("id", reservationId)
    .eq("channel", "direct")
    .in("status", ["inquiry", "pending", "confirmed", "cancelled"])
    .select("id,status")
    .single();

  if (error || !data) {
    mutationError(
      "lead_update_failed",
      "No se ha podido actualizar el lead directo.",
    );
  }

  return data;
}

export async function updateManualReservation(
  supabase: SupabaseServerClient,
  reservationId: string,
  input: ManualReservationInput,
) {
  const { data: existing, error: existingError } = await supabase
    .from("reservations")
    .select("guest_id")
    .eq("id", reservationId)
    .single();

  if (existingError || !existing?.guest_id) {
    mutationError(
      "reservation_not_found",
      "No se ha encontrado la reserva para editar.",
    );
  }

  const { error: guestError } = await supabase
    .from("guests")
    .update({
      email: input.guestEmail ?? null,
      full_name: input.guestFullName,
      phone: input.guestPhone ?? null,
    })
    .eq("id", existing.guest_id);

  if (guestError) {
    mutationError(
      "guest_update_failed",
      "No se ha podido actualizar el huesped de la reserva.",
    );
  }

  const nights = nightsBetween(input.checkIn, input.checkOut);
  const totalAmount =
    nights * input.nightlyRate + input.cleaningFee + input.taxesAmount;
  const { data, error } = await supabase
    .from("reservations")
    .update({
      channel: input.channel,
      check_in: input.checkIn,
      check_out: input.checkOut,
      cleaning_fee: input.cleaningFee,
      guests_count: input.guestsCount,
      nightly_rate: input.nightlyRate,
      notes: input.notes ?? null,
      payout_amount: totalAmount,
      property_id: input.propertyId,
      security_deposit: input.securityDeposit,
      status: input.status,
      taxes_amount: input.taxesAmount,
      total_amount: totalAmount,
    })
    .eq("id", reservationId)
    .select("id,status,total_amount")
    .single();

  if (error || !data) {
    mutationError(
      "reservation_update_failed",
      "No se ha podido actualizar la reserva.",
    );
  }

  return data;
}

export async function createTask(
  supabase: SupabaseServerClient,
  input: TaskInput,
  userId: string,
) {
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      created_by: userId,
      description: input.description ?? null,
      due_at: toDatabaseDateTime(input.dueAt),
      priority: input.priority,
      property_id: input.propertyId,
      reservation_id: input.reservationId ?? null,
      status: input.status,
      title: input.title,
      type: input.type,
    })
    .select("id,status")
    .single();

  if (error || !data) {
    mutationError("task_create_failed", "No se ha podido crear la tarea.");
  }

  return data;
}

export async function updateTask(
  supabase: SupabaseServerClient,
  taskId: string,
  input: TaskInput,
) {
  const completedAt = input.status === "done" ? new Date().toISOString() : null;
  const { data, error } = await supabase
    .from("tasks")
    .update({
      completed_at: completedAt,
      description: input.description ?? null,
      due_at: toDatabaseDateTime(input.dueAt),
      priority: input.priority,
      property_id: input.propertyId,
      reservation_id: input.reservationId ?? null,
      status: input.status,
      title: input.title,
      type: input.type,
    })
    .eq("id", taskId)
    .select("id,status")
    .single();

  if (error || !data) {
    mutationError("task_update_failed", "No se ha podido actualizar la tarea.");
  }

  return data;
}

export async function updateTaskStatus(
  supabase: SupabaseServerClient,
  taskId: string,
  status: string,
) {
  const completedAt = status === "done" ? new Date().toISOString() : null;
  const { data, error } = await supabase
    .from("tasks")
    .update({ completed_at: completedAt, status })
    .eq("id", taskId)
    .select("id,status")
    .single();

  if (error || !data) {
    mutationError("task_update_failed", "No se ha podido actualizar la tarea.");
  }

  return data;
}

export async function createIncident(
  supabase: SupabaseServerClient,
  input: IncidentInput,
  userId: string,
) {
  const { data, error } = await supabase
    .from("incidents")
    .insert({
      description: input.description,
      estimated_cost: input.estimatedCost ?? null,
      property_id: input.propertyId,
      reported_by: userId,
      reservation_id: input.reservationId ?? null,
      severity: input.severity,
      status: input.status,
      title: input.title,
    })
    .select("id,status")
    .single();

  if (error || !data) {
    mutationError(
      "incident_create_failed",
      "No se ha podido crear la incidencia.",
    );
  }

  return data;
}

export async function updateIncident(
  supabase: SupabaseServerClient,
  incidentId: string,
  input: IncidentInput,
) {
  const resolvedAt = ["resolved", "charged", "cancelled"].includes(input.status)
    ? new Date().toISOString()
    : null;
  const { data, error } = await supabase
    .from("incidents")
    .update({
      description: input.description,
      estimated_cost: input.estimatedCost ?? null,
      property_id: input.propertyId,
      reservation_id: input.reservationId ?? null,
      resolved_at: resolvedAt,
      severity: input.severity,
      status: input.status,
      title: input.title,
    })
    .eq("id", incidentId)
    .select("id,status")
    .single();

  if (error || !data) {
    mutationError(
      "incident_update_failed",
      "No se ha podido actualizar la incidencia.",
    );
  }

  return data;
}

export async function updateIncidentStatus(
  supabase: SupabaseServerClient,
  incidentId: string,
  status: string,
) {
  const resolvedAt = ["resolved", "charged", "cancelled"].includes(status)
    ? new Date().toISOString()
    : null;
  const { data, error } = await supabase
    .from("incidents")
    .update({ resolved_at: resolvedAt, status })
    .eq("id", incidentId)
    .select("id,status")
    .single();

  if (error || !data) {
    mutationError(
      "incident_update_failed",
      "No se ha podido actualizar la incidencia.",
    );
  }

  return data;
}

export async function sendConversationReply(
  supabase: SupabaseServerClient,
  input: MessageInput,
  userId: string,
) {
  const sentAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("conversation_messages")
    .insert({
      body: input.body,
      channel: input.channel,
      conversation_id: input.conversationId,
      direction: "outbound",
      sender_profile_id: userId,
      sent_at: sentAt,
    })
    .select("id,conversation_id")
    .single();

  if (error || !data) {
    mutationError("message_send_failed", "No se ha podido enviar el mensaje.");
  }

  await supabase
    .from("conversations")
    .update({ last_message_at: sentAt, status: "pending_guest" })
    .eq("id", input.conversationId);

  return data;
}
