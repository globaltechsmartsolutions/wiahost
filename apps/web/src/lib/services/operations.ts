import type {
  ChannelInboundMessageInput,
  IncidentInput,
  ManualReservationInput,
  MessageInput,
  MessageLabelInput,
  TaskInput,
} from "@wiahost/shared";
import type { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  assertPropertyDateRangeAvailable,
  AvailabilityConflictError,
} from "@/lib/services/availability";
import { createPaymentCheckoutLink } from "@/lib/services/payments";
import {
  sendOperationalPushSafely,
  shouldAlertOperations,
} from "@/lib/services/operational-push";

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

function mapAvailabilityConflict(error: unknown): never {
  if (error instanceof AvailabilityConflictError) {
    mutationError(error.code, error.message);
  }

  throw error;
}

async function recordOperationalEvent(
  supabase: SupabaseServerClient,
  input: {
    conversationId?: string;
    entityId?: string;
    entityType: string;
    eventName: string;
    incidentId?: string | null;
    metadata?: Record<string, unknown>;
    propertyId?: string | null;
    reservationId?: string | null;
    taskId?: string | null;
    userId: string;
  },
) {
  try {
    await supabase.from("operational_events").insert({
      actor_profile_id: input.userId,
      actor_type: "user",
      conversation_id: input.conversationId ?? null,
      entity_id: input.entityId ?? input.conversationId ?? null,
      entity_type: input.entityType,
      event_name: input.eventName,
      incident_id: input.incidentId ?? null,
      metadata: input.metadata ?? {},
      property_id: input.propertyId ?? null,
      reservation_id: input.reservationId ?? null,
      source: "web",
      task_id: input.taskId ?? null,
    });
  } catch {
    // Audit events must never block the operation they describe.
  }
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

function taskOutcome(
  status: string,
  dueAt: string | null,
  completedAt: string | null,
) {
  if (status === "cancelled") {
    return "cancelled";
  }

  if (status === "blocked") {
    return "blocked";
  }

  if (status !== "done") {
    return "pending";
  }

  if (!dueAt || !completedAt) {
    return "completed_on_time";
  }

  return new Date(completedAt).getTime() <= new Date(dueAt).getTime()
    ? "completed_on_time"
    : "completed_late";
}

function slaMinutesDelta(dueAt: string | null, completedAt: string | null) {
  if (!dueAt || !completedAt) {
    return null;
  }

  const dueTime = new Date(dueAt).getTime();
  const completedTime = new Date(completedAt).getTime();

  if (Number.isNaN(dueTime) || Number.isNaN(completedTime)) {
    return null;
  }

  return Math.round((completedTime - dueTime) / 60000);
}

async function syncTaskOutcome(
  supabase: SupabaseServerClient,
  input: {
    assignedTo?: string | null;
    completedAt?: string | null;
    dueAt?: string | null;
    priority: string;
    propertyId: string;
    reservationId?: string | null;
    status: string;
    taskId: string;
  },
) {
  const { error } = await supabase.from("task_outcomes").upsert(
    {
      assigned_to: input.assignedTo ?? null,
      completed_at: input.completedAt ?? null,
      outcome: taskOutcome(
        input.status,
        input.dueAt ?? null,
        input.completedAt ?? null,
      ),
      priority: input.priority,
      property_id: input.propertyId,
      reservation_id: input.reservationId ?? null,
      sla_due_at: input.dueAt ?? null,
      sla_minutes_delta: slaMinutesDelta(
        input.dueAt ?? null,
        input.completedAt ?? null,
      ),
      status: input.status,
      task_id: input.taskId,
    },
    { onConflict: "task_id" },
  );

  if (error) {
    mutationError(
      "task_outcome_sync_failed",
      "No se ha podido actualizar el resultado operativo de la tarea.",
    );
  }
}

export async function createManualReservation(
  supabase: SupabaseServerClient,
  input: ManualReservationInput,
  userId: string,
) {
  try {
    await assertPropertyDateRangeAvailable(supabase, {
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      propertyId: input.propertyId,
    });
  } catch (error) {
    mapAvailabilityConflict(error);
  }

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
    .select("id,status,total_amount,property_id,guest_id,channel")
    .single();

  if (error || !data) {
    mutationError(
      "reservation_create_failed",
      "No se ha podido crear la reserva. Revisa permisos/RLS y disponibilidad.",
    );
  }

  await recordOperationalEvent(supabase, {
    entityId: data.id,
    entityType: "reservation",
    eventName: "reservation.created",
    metadata: {
      channel: data.channel,
      guestId: data.guest_id,
      status: data.status,
      totalAmount: Number(data.total_amount ?? 0),
    },
    propertyId: data.property_id,
    reservationId: data.id,
    userId,
  });

  if (["confirmed", "checked_in", "pending"].includes(data.status)) {
    await sendOperationalPushSafely(supabase, userId, {
      body: `${input.guestFullName} - ${input.checkIn} a ${input.checkOut}.`,
      data: {
        entityId: data.id,
        entityType: "reservation",
        propertyId: data.property_id,
        reservationId: data.id,
        route: `/reservations/${data.id}`,
        status: data.status,
      },
      includeOperators: true,
      priority: data.status === "checked_in" ? "high" : "normal",
      skipUserId: userId,
      title: "Nueva reserva operativa",
      type: "reservation_created",
    });
  }

  return data;
}

export async function updateReservationStatus(
  supabase: SupabaseServerClient,
  reservationId: string,
  status: string,
  userId: string,
) {
  const { data, error } = await supabase
    .from("reservations")
    .update({ status })
    .eq("id", reservationId)
    .select("id,status,property_id,channel")
    .single();

  if (error || !data) {
    mutationError(
      "reservation_update_failed",
      "No se ha podido actualizar la reserva.",
    );
  }

  await recordOperationalEvent(supabase, {
    entityId: data.id,
    entityType: "reservation",
    eventName: "reservation.status_updated",
    metadata: {
      channel: data.channel,
      status: data.status,
    },
    propertyId: data.property_id,
    reservationId: data.id,
    userId,
  });

  if (
    ["confirmed", "checked_in", "checked_out", "cancelled"].includes(status)
  ) {
    await sendOperationalPushSafely(supabase, userId, {
      body: `La reserva ${data.id.slice(0, 8)} cambia a ${status}.`,
      data: {
        entityId: data.id,
        entityType: "reservation",
        propertyId: data.property_id,
        reservationId: data.id,
        route: `/reservations/${data.id}`,
        status,
      },
      includeOperators: true,
      priority: status === "cancelled" ? "high" : "normal",
      skipUserId: userId,
      title: "Reserva actualizada",
      type: "reservation_status_updated",
    });
  }

  return data;
}

export async function updateDirectLeadStatus(
  supabase: SupabaseServerClient,
  reservationId: string,
  status: "pending" | "confirmed" | "cancelled",
  userId: string,
) {
  const { data, error } = await supabase
    .from("reservations")
    .update({ status })
    .eq("id", reservationId)
    .eq("channel", "direct")
    .in("status", ["inquiry", "pending", "confirmed", "cancelled"])
    .select("id,status,property_id,channel")
    .single();

  if (error || !data) {
    mutationError(
      "lead_update_failed",
      "No se ha podido actualizar el lead directo.",
    );
  }

  await recordOperationalEvent(supabase, {
    entityId: data.id,
    entityType: "reservation",
    eventName: "lead.status_updated",
    metadata: {
      channel: data.channel,
      status: data.status,
    },
    propertyId: data.property_id,
    reservationId: data.id,
    userId,
  });

  return data;
}

export async function prepareDirectLeadPayment(
  supabase: SupabaseServerClient,
  reservationId: string,
  userId: string,
) {
  const { data: reservation, error: reservationError } = await supabase
    .from("reservations")
    .select("id,property_id,guest_id,status,total_amount,currency")
    .eq("id", reservationId)
    .eq("channel", "direct")
    .in("status", ["inquiry", "pending", "confirmed"])
    .single();

  if (reservationError || !reservation) {
    mutationError(
      "lead_payment_reservation_not_found",
      "No se ha encontrado el lead directo para preparar el pago.",
    );
  }

  const { data: existingPayment, error: existingPaymentError } = await supabase
    .from("payments")
    .select("id,status,amount")
    .eq("reservation_id", reservationId)
    .eq("provider", "direct_checkout")
    .maybeSingle();

  if (existingPaymentError) {
    mutationError(
      "lead_payment_lookup_failed",
      "No se ha podido revisar si el pago ya estaba preparado.",
    );
  }

  let payment = existingPayment;
  let created = false;

  if (!payment) {
    const { data: newPayment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        amount: Number(reservation.total_amount ?? 0),
        currency: reservation.currency ?? "EUR",
        guest_id: reservation.guest_id,
        metadata: {
          mode: "manual_checkout_placeholder",
          source: "direct_booking_payment_request",
        },
        provider: "direct_checkout",
        reservation_id: reservationId,
        status: "pending",
      })
      .select("id,status,amount")
      .single();

    if (paymentError || !newPayment) {
      mutationError(
        "lead_payment_create_failed",
        "No se ha podido preparar el pago del lead.",
      );
    }

    payment = newPayment;
    created = true;
  }

  if (reservation.status === "inquiry") {
    await supabase
      .from("reservations")
      .update({ status: "pending" })
      .eq("id", reservationId);
  }

  await supabase.from("channel_sync_events").insert({
    channel: "direct",
    direction: "outbound",
    payload: {
      action: "direct_payment_request_prepared",
      amount: Number(reservation.total_amount ?? 0),
      paymentId: payment.id,
      reservationId,
      source: "direct_booking_pipeline",
    },
    property_id: reservation.property_id,
    status: "pending",
  });

  const checkout = await createPaymentCheckoutLink(supabase, payment.id);

  await recordOperationalEvent(supabase, {
    entityId: reservationId,
    entityType: "reservation",
    eventName: "lead.payment_requested",
    metadata: {
      created,
      paymentId: payment.id,
      provider: checkout.provider,
      status: payment.status,
    },
    propertyId: reservation.property_id,
    reservationId,
    userId,
  });

  return {
    checkoutUrl: checkout.checkoutUrl,
    created,
    paymentId: payment.id,
    status: payment.status,
  };
}

export async function updateManualReservation(
  supabase: SupabaseServerClient,
  reservationId: string,
  input: ManualReservationInput,
  userId: string,
) {
  try {
    await assertPropertyDateRangeAvailable(supabase, {
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      excludeReservationId: reservationId,
      propertyId: input.propertyId,
    });
  } catch (error) {
    mapAvailabilityConflict(error);
  }

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
    .select("id,status,total_amount,property_id,guest_id,channel")
    .single();

  if (error || !data) {
    mutationError(
      "reservation_update_failed",
      "No se ha podido actualizar la reserva.",
    );
  }

  await recordOperationalEvent(supabase, {
    entityId: data.id,
    entityType: "reservation",
    eventName: "reservation.updated",
    metadata: {
      channel: data.channel,
      guestId: data.guest_id,
      status: data.status,
      totalAmount: Number(data.total_amount ?? 0),
    },
    propertyId: data.property_id,
    reservationId: data.id,
    userId,
  });

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
    .select(
      "id,status,property_id,reservation_id,assigned_to,priority,due_at,completed_at",
    )
    .single();

  if (error || !data) {
    mutationError("task_create_failed", "No se ha podido crear la tarea.");
  }

  await syncTaskOutcome(supabase, {
    assignedTo: data.assigned_to,
    completedAt: data.completed_at,
    dueAt: data.due_at,
    priority: data.priority,
    propertyId: data.property_id,
    reservationId: data.reservation_id,
    status: data.status,
    taskId: data.id,
  });

  await recordOperationalEvent(supabase, {
    entityId: data.id,
    entityType: "task",
    eventName: "task.created",
    metadata: {
      priority: data.priority,
      status: data.status,
    },
    propertyId: data.property_id,
    reservationId: data.reservation_id,
    taskId: data.id,
    userId,
  });

  if (shouldAlertOperations({ priority: data.priority, status: data.status })) {
    await sendOperationalPushSafely(supabase, userId, {
      assignedTo: data.assigned_to,
      body: `${input.title} - prioridad ${data.priority}.`,
      data: {
        entityId: data.id,
        entityType: "task",
        propertyId: data.property_id,
        reservationId: data.reservation_id,
        route: `/tasks/${data.id}`,
        taskId: data.id,
      },
      includeOperators: !data.assigned_to,
      priority: data.priority === "critical" ? "high" : "normal",
      skipUserId: userId,
      title: "Nueva tarea prioritaria",
      type: "task_created",
    });
  }

  return data;
}

export async function updateTask(
  supabase: SupabaseServerClient,
  taskId: string,
  input: TaskInput,
  userId: string,
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
    .select(
      "id,status,property_id,reservation_id,assigned_to,priority,due_at,completed_at",
    )
    .single();

  if (error || !data) {
    mutationError("task_update_failed", "No se ha podido actualizar la tarea.");
  }

  await syncTaskOutcome(supabase, {
    assignedTo: data.assigned_to,
    completedAt: data.completed_at,
    dueAt: data.due_at,
    priority: data.priority,
    propertyId: data.property_id,
    reservationId: data.reservation_id,
    status: data.status,
    taskId: data.id,
  });

  await recordOperationalEvent(supabase, {
    entityId: data.id,
    entityType: "task",
    eventName: "task.updated",
    metadata: {
      priority: data.priority,
      status: data.status,
    },
    propertyId: data.property_id,
    reservationId: data.reservation_id,
    taskId: data.id,
    userId,
  });

  if (shouldAlertOperations({ priority: data.priority, status: data.status })) {
    await sendOperationalPushSafely(supabase, userId, {
      assignedTo: data.assigned_to,
      body: `La tarea ${data.id.slice(0, 8)} esta ahora en ${data.status}.`,
      data: {
        entityId: data.id,
        entityType: "task",
        propertyId: data.property_id,
        reservationId: data.reservation_id,
        route: `/tasks/${data.id}`,
        status: data.status,
        taskId: data.id,
      },
      includeOperators: data.status === "blocked",
      priority: data.status === "blocked" ? "high" : "normal",
      skipUserId: userId,
      title: "Tarea actualizada",
      type: "task_status_updated",
    });
  }

  return data;
}

export async function updateTaskStatus(
  supabase: SupabaseServerClient,
  taskId: string,
  status: string,
  userId: string,
) {
  const completedAt = status === "done" ? new Date().toISOString() : null;
  const { data, error } = await supabase
    .from("tasks")
    .update({ completed_at: completedAt, status })
    .eq("id", taskId)
    .select(
      "id,status,property_id,reservation_id,assigned_to,priority,due_at,completed_at",
    )
    .single();

  if (error || !data) {
    mutationError("task_update_failed", "No se ha podido actualizar la tarea.");
  }

  await syncTaskOutcome(supabase, {
    assignedTo: data.assigned_to,
    completedAt: data.completed_at,
    dueAt: data.due_at,
    priority: data.priority,
    propertyId: data.property_id,
    reservationId: data.reservation_id,
    status: data.status,
    taskId: data.id,
  });

  await recordOperationalEvent(supabase, {
    entityId: data.id,
    entityType: "task",
    eventName: "task.status_updated",
    metadata: {
      outcome: taskOutcome(data.status, data.due_at, data.completed_at),
      priority: data.priority,
      status: data.status,
    },
    propertyId: data.property_id,
    reservationId: data.reservation_id,
    taskId: data.id,
    userId,
  });

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
    .select("id,status,property_id,reservation_id,severity,estimated_cost")
    .single();

  if (error || !data) {
    mutationError(
      "incident_create_failed",
      "No se ha podido crear la incidencia.",
    );
  }

  await recordOperationalEvent(supabase, {
    entityId: data.id,
    entityType: "incident",
    eventName: "incident.created",
    incidentId: data.id,
    metadata: {
      estimatedCost: Number(data.estimated_cost ?? 0),
      severity: data.severity,
      status: data.status,
    },
    propertyId: data.property_id,
    reservationId: data.reservation_id,
    userId,
  });

  if (shouldAlertOperations({ severity: data.severity, status: data.status })) {
    await sendOperationalPushSafely(supabase, userId, {
      body: `${input.title} - severidad ${data.severity}.`,
      data: {
        entityId: data.id,
        entityType: "incident",
        incidentId: data.id,
        propertyId: data.property_id,
        reservationId: data.reservation_id,
        route: `/incidents/${data.id}`,
        severity: data.severity,
      },
      includeOperators: true,
      priority: data.severity === "critical" ? "high" : "normal",
      skipUserId: userId,
      title: "Nueva incidencia operativa",
      type: "incident_created",
    });
  }

  return data;
}

export async function updateIncident(
  supabase: SupabaseServerClient,
  incidentId: string,
  input: IncidentInput,
  userId: string,
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
    .select("id,status,property_id,reservation_id,severity,estimated_cost")
    .single();

  if (error || !data) {
    mutationError(
      "incident_update_failed",
      "No se ha podido actualizar la incidencia.",
    );
  }

  await recordOperationalEvent(supabase, {
    entityId: data.id,
    entityType: "incident",
    eventName: "incident.updated",
    incidentId: data.id,
    metadata: {
      estimatedCost: Number(data.estimated_cost ?? 0),
      severity: data.severity,
      status: data.status,
    },
    propertyId: data.property_id,
    reservationId: data.reservation_id,
    userId,
  });

  if (shouldAlertOperations({ severity: data.severity, status: data.status })) {
    await sendOperationalPushSafely(supabase, userId, {
      body: `La incidencia ${data.id.slice(0, 8)} cambia a ${data.status}.`,
      data: {
        entityId: data.id,
        entityType: "incident",
        incidentId: data.id,
        propertyId: data.property_id,
        reservationId: data.reservation_id,
        route: `/incidents/${data.id}`,
        status: data.status,
      },
      includeOperators: true,
      priority: data.status === "investigating" ? "high" : "normal",
      skipUserId: userId,
      title: "Incidencia actualizada",
      type: "incident_status_updated",
    });
  }

  return data;
}

export async function updateIncidentStatus(
  supabase: SupabaseServerClient,
  incidentId: string,
  status: string,
  userId: string,
) {
  const resolvedAt = ["resolved", "charged", "cancelled"].includes(status)
    ? new Date().toISOString()
    : null;
  const { data, error } = await supabase
    .from("incidents")
    .update({ resolved_at: resolvedAt, status })
    .eq("id", incidentId)
    .select("id,status,property_id,reservation_id,severity,estimated_cost")
    .single();

  if (error || !data) {
    mutationError(
      "incident_update_failed",
      "No se ha podido actualizar la incidencia.",
    );
  }

  await recordOperationalEvent(supabase, {
    entityId: data.id,
    entityType: "incident",
    eventName: "incident.status_updated",
    incidentId: data.id,
    metadata: {
      estimatedCost: Number(data.estimated_cost ?? 0),
      severity: data.severity,
      status: data.status,
    },
    propertyId: data.property_id,
    reservationId: data.reservation_id,
    userId,
  });

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

  await recordOperationalEvent(supabase, {
    conversationId: input.conversationId,
    entityType: "conversation",
    eventName: "conversation.reply_sent",
    metadata: {
      channel: input.channel,
      messageId: data.id,
    },
    userId,
  });

  return data;
}

export async function updateConversationStatus(
  supabase: SupabaseServerClient,
  conversationId: string,
  status: string,
  userId: string,
) {
  const { data, error } = await supabase
    .from("conversations")
    .update({ status })
    .eq("id", conversationId)
    .select("id,status")
    .single();

  if (error || !data) {
    mutationError(
      "conversation_update_failed",
      "No se ha podido actualizar la conversacion.",
    );
  }

  await recordOperationalEvent(supabase, {
    conversationId,
    entityType: "conversation",
    eventName: "conversation.status_updated",
    metadata: {
      status,
    },
    userId,
  });

  return data;
}

export async function createConversationMessageLabel(
  supabase: SupabaseServerClient,
  input: MessageLabelInput,
  userId: string,
) {
  const { data, error } = await supabase
    .from("message_labels")
    .insert({
      category: input.category ?? null,
      confidence: input.confidence ?? null,
      conversation_id: input.conversationId,
      intent: input.intent ?? null,
      labeled_by: userId,
      language: input.language ?? null,
      message_id: input.messageId ?? null,
      metadata: {
        ...input.metadata,
        source_ui: "inbox_detail",
      },
      rationale: input.rationale ?? null,
      sentiment: input.sentiment ?? null,
      source: input.source,
      urgency: input.urgency ?? null,
    })
    .select("id,conversation_id")
    .single();

  if (error || !data) {
    mutationError(
      "message_label_create_failed",
      "No se ha podido guardar la etiqueta del hilo.",
    );
  }

  await recordOperationalEvent(supabase, {
    conversationId: input.conversationId,
    entityType: "conversation",
    eventName: "conversation.label_created",
    metadata: {
      category: input.category ?? null,
      intent: input.intent ?? null,
      labelId: data.id,
      sentiment: input.sentiment ?? null,
      urgency: input.urgency ?? null,
    },
    userId,
  });

  return data;
}

function channelSyncChannel(channel: string) {
  return ["airbnb", "booking", "vrbo"].includes(channel) ? channel : "manual";
}

function validSentAt(value: string | undefined) {
  if (!value) {
    return new Date().toISOString();
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? new Date().toISOString()
    : date.toISOString();
}

export async function ingestChannelMessage(
  supabase: SupabaseServerClient,
  input: ChannelInboundMessageInput,
  userId?: string,
) {
  const sentAt = validSentAt(input.sentAt);
  let guestId: string | null = null;

  if (input.guestEmail) {
    const { data: existingGuest } = await supabase
      .from("guests")
      .select("id")
      .eq("email", input.guestEmail)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    guestId = existingGuest?.id ?? null;
  }

  if (!guestId) {
    const { data: guest, error: guestError } = await supabase
      .from("guests")
      .insert({
        email: input.guestEmail ?? null,
        full_name: input.guestFullName,
        notes: `Creado desde mensaje entrante ${input.channel}.`,
        phone: input.guestPhone ?? null,
        preferred_language: "es",
        tags: ["channel_inbound"],
      })
      .select("id")
      .single();

    if (guestError || !guest) {
      mutationError(
        "inbound_guest_create_failed",
        "No se ha podido crear el contacto del mensaje.",
      );
    }

    guestId = guest.id;
  }

  let conversationId: string | null = null;

  if (input.reservationId) {
    const { data: existingConversation } = await supabase
      .from("conversations")
      .select("id")
      .eq("reservation_id", input.reservationId)
      .limit(1)
      .maybeSingle();

    conversationId = existingConversation?.id ?? null;
  }

  if (!conversationId) {
    const { data: existingConversation } = await supabase
      .from("conversations")
      .select("id")
      .eq("property_id", input.propertyId)
      .eq("guest_id", guestId)
      .neq("status", "archived")
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    conversationId = existingConversation?.id ?? null;
  }

  if (!conversationId) {
    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .insert({
        guest_id: guestId,
        last_message_at: sentAt,
        property_id: input.propertyId,
        reservation_id: input.reservationId ?? null,
        status: "pending_team",
      })
      .select("id")
      .single();

    if (conversationError || !conversation) {
      mutationError(
        "inbound_conversation_create_failed",
        "No se ha podido crear la conversacion entrante.",
      );
    }

    conversationId = conversation.id;
  }

  const { data: message, error: messageError } = await supabase
    .from("conversation_messages")
    .insert({
      body: input.body,
      channel: input.channel,
      conversation_id: conversationId,
      direction: "inbound",
      external_message_id: input.externalMessageId ?? null,
      metadata: {
        source: "channel_message_ingestion",
      },
      sent_at: sentAt,
    })
    .select("id,conversation_id")
    .single();

  if (messageError || !message) {
    mutationError(
      "inbound_message_create_failed",
      "No se ha podido guardar el mensaje entrante.",
    );
  }

  await supabase
    .from("conversations")
    .update({ last_message_at: sentAt, status: "pending_team" })
    .eq("id", conversationId);

  await supabase.from("channel_sync_events").insert({
    channel: channelSyncChannel(input.channel),
    direction: "inbound",
    payload: {
      action: "inbound_message",
      channel: input.channel,
      conversationId,
      externalMessageId: input.externalMessageId,
      guestId,
      messageId: message.id,
      reservationId: input.reservationId,
    },
    property_id: input.propertyId,
    status: "synced",
  });

  if (userId) {
    await sendOperationalPushSafely(supabase, userId, {
      body: `${input.guestFullName}: ${input.body.slice(0, 120)}`,
      data: {
        channel: input.channel,
        conversationId,
        entityId: conversationId,
        entityType: "conversation",
        messageId: message.id,
        propertyId: input.propertyId,
        reservationId: input.reservationId ?? null,
        route: `/inbox/${conversationId}`,
      },
      includeOperators: true,
      priority: "high",
      skipUserId: userId,
      title: "Nuevo mensaje de huesped",
      type: "inbound_message",
    });
  }

  return {
    conversationId,
    guestId,
    messageId: message.id,
  };
}
