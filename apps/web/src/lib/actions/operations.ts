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

import {
  createIncident,
  createManualReservation,
  createTask,
  OperationMutationError,
  sendConversationReply,
  updateIncident,
  updateIncidentStatus,
  updateManualReservation,
  updateTask,
  updateReservationStatus,
  updateTaskStatus,
} from "@/lib/services/operations";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const idSchema = z.guid();

function requiredString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function formPayload(formData: FormData, keys: string[]) {
  return keys.reduce<Record<string, FormDataEntryValue | undefined>>(
    (payload, key) => {
      payload[key] = formData.get(key) ?? undefined;
      return payload;
    },
    {},
  );
}

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function mutationMessage(error: unknown, fallback: string) {
  if (error instanceof OperationMutationError) {
    return error.message;
  }

  return fallback;
}

async function getMutationContext(path: string) {
  if (!isSupabaseConfigured()) {
    redirectWithError(
      path,
      "Supabase no esta configurado. Levanta Supabase local para guardar cambios.",
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect(
      `/login?error=${encodeURIComponent("Inicia sesion para modificar la operacion.")}`,
    );
  }

  return { supabase, userId: userData.user.id };
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
    redirectWithError(
      path,
      parsed.error.issues[0]?.message ?? "Datos de reserva invalidos.",
    );
  }

  const { supabase } = await getMutationContext(path);
  let reservationId: string;

  try {
    const reservation = await createManualReservation(supabase, parsed.data);
    reservationId = reservation.id;
  } catch (error) {
    redirectWithError(
      path,
      mutationMessage(error, "No se ha podido crear la reserva."),
    );
  }

  revalidatePath("/reservations");
  revalidatePath("/dashboard");
  redirect(`/reservations/${reservationId}?created=1`);
}

export async function updateReservationStatusAction(formData: FormData) {
  const path = "/reservations";
  const reservationId = idSchema.safeParse(
    requiredString(formData, "reservationId"),
  );
  const parsed = updateReservationStatusSchema.safeParse({
    status: requiredString(formData, "status"),
  });

  if (!reservationId.success || !parsed.success) {
    redirectWithError(path, "Estado de reserva invalido.");
  }

  const { supabase } = await getMutationContext(path);

  try {
    await updateReservationStatus(
      supabase,
      reservationId.data,
      parsed.data.status,
    );
  } catch (error) {
    redirectWithError(
      path,
      mutationMessage(error, "No se ha podido actualizar la reserva."),
    );
  }

  revalidatePath("/reservations");
  revalidatePath("/dashboard");
  redirect("/reservations?updated=1");
}

export async function updateManualReservationAction(formData: FormData) {
  const reservationId = idSchema.safeParse(
    requiredString(formData, "reservationId"),
  );

  if (!reservationId.success) {
    redirectWithError("/reservations", "Reserva no valida.");
  }

  const path = `/reservations/${reservationId.data}/edit`;
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
    redirectWithError(
      path,
      parsed.error.issues[0]?.message ?? "Datos de reserva invalidos.",
    );
  }

  const { supabase } = await getMutationContext(path);

  try {
    await updateManualReservation(supabase, reservationId.data, parsed.data);
  } catch (error) {
    redirectWithError(
      path,
      mutationMessage(error, "No se ha podido actualizar la reserva."),
    );
  }

  revalidatePath("/reservations");
  revalidatePath(`/reservations/${reservationId.data}`);
  revalidatePath("/dashboard");
  redirect(`/reservations/${reservationId.data}?updated=1`);
}

export async function createTaskAction(formData: FormData) {
  const path = "/tasks";
  const parsed = taskSchema.safeParse(
    formPayload(formData, [
      "propertyId",
      "reservationId",
      "title",
      "description",
      "type",
      "status",
      "dueAt",
      "priority",
    ]),
  );

  if (!parsed.success) {
    redirectWithError(
      path,
      parsed.error.issues[0]?.message ?? "Datos de tarea invalidos.",
    );
  }

  const { supabase, userId } = await getMutationContext(path);
  let taskId: string;

  try {
    const task = await createTask(supabase, parsed.data, userId);
    taskId = task.id;
  } catch (error) {
    redirectWithError(
      path,
      mutationMessage(error, "No se ha podido crear la tarea."),
    );
  }

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  redirect(`/tasks/${taskId}?created=1`);
}

export async function updateTaskStatusAction(formData: FormData) {
  const path = "/tasks";
  const taskId = idSchema.safeParse(requiredString(formData, "taskId"));
  const parsed = updateTaskStatusSchema.safeParse({
    status: requiredString(formData, "status"),
  });

  if (!taskId.success || !parsed.success) {
    redirectWithError(path, "Estado de tarea invalido.");
  }

  const { supabase } = await getMutationContext(path);

  try {
    await updateTaskStatus(supabase, taskId.data, parsed.data.status);
  } catch (error) {
    redirectWithError(
      path,
      mutationMessage(error, "No se ha podido actualizar la tarea."),
    );
  }

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  redirect("/tasks?updated=1");
}

export async function updateTaskAction(formData: FormData) {
  const taskId = idSchema.safeParse(requiredString(formData, "taskId"));

  if (!taskId.success) {
    redirectWithError("/tasks", "Tarea no valida.");
  }

  const path = `/tasks/${taskId.data}/edit`;
  const parsed = taskSchema.safeParse(
    formPayload(formData, [
      "propertyId",
      "reservationId",
      "title",
      "description",
      "type",
      "status",
      "dueAt",
      "priority",
    ]),
  );

  if (!parsed.success) {
    redirectWithError(
      path,
      parsed.error.issues[0]?.message ?? "Datos de tarea invalidos.",
    );
  }

  const { supabase } = await getMutationContext(path);

  try {
    await updateTask(supabase, taskId.data, parsed.data);
  } catch (error) {
    redirectWithError(
      path,
      mutationMessage(error, "No se ha podido actualizar la tarea."),
    );
  }

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${taskId.data}`);
  revalidatePath("/dashboard");
  redirect(`/tasks/${taskId.data}?updated=1`);
}

export async function createIncidentAction(formData: FormData) {
  const path = "/incidents";
  const parsed = incidentSchema.safeParse(
    formPayload(formData, [
      "propertyId",
      "reservationId",
      "title",
      "description",
      "severity",
      "status",
      "estimatedCost",
    ]),
  );

  if (!parsed.success) {
    redirectWithError(
      path,
      parsed.error.issues[0]?.message ?? "Datos de incidencia invalidos.",
    );
  }

  const { supabase, userId } = await getMutationContext(path);
  let incidentId: string;

  try {
    const incident = await createIncident(supabase, parsed.data, userId);
    incidentId = incident.id;
  } catch (error) {
    redirectWithError(
      path,
      mutationMessage(error, "No se ha podido crear la incidencia."),
    );
  }

  revalidatePath("/incidents");
  revalidatePath("/dashboard");
  redirect(`/incidents/${incidentId}?created=1`);
}

export async function updateIncidentStatusAction(formData: FormData) {
  const path = "/incidents";
  const incidentId = idSchema.safeParse(requiredString(formData, "incidentId"));
  const parsed = updateIncidentStatusSchema.safeParse({
    status: requiredString(formData, "status"),
  });

  if (!incidentId.success || !parsed.success) {
    redirectWithError(path, "Estado de incidencia invalido.");
  }

  const { supabase } = await getMutationContext(path);

  try {
    await updateIncidentStatus(supabase, incidentId.data, parsed.data.status);
  } catch (error) {
    redirectWithError(
      path,
      mutationMessage(error, "No se ha podido actualizar la incidencia."),
    );
  }

  revalidatePath("/incidents");
  revalidatePath("/dashboard");
  redirect("/incidents?updated=1");
}

export async function updateIncidentAction(formData: FormData) {
  const incidentId = idSchema.safeParse(requiredString(formData, "incidentId"));

  if (!incidentId.success) {
    redirectWithError("/incidents", "Incidencia no valida.");
  }

  const path = `/incidents/${incidentId.data}/edit`;
  const parsed = incidentSchema.safeParse(
    formPayload(formData, [
      "propertyId",
      "reservationId",
      "title",
      "description",
      "severity",
      "status",
      "estimatedCost",
    ]),
  );

  if (!parsed.success) {
    redirectWithError(
      path,
      parsed.error.issues[0]?.message ?? "Datos de incidencia invalidos.",
    );
  }

  const { supabase } = await getMutationContext(path);

  try {
    await updateIncident(supabase, incidentId.data, parsed.data);
  } catch (error) {
    redirectWithError(
      path,
      mutationMessage(error, "No se ha podido actualizar la incidencia."),
    );
  }

  revalidatePath("/incidents");
  revalidatePath(`/incidents/${incidentId.data}`);
  revalidatePath("/dashboard");
  redirect(`/incidents/${incidentId.data}?updated=1`);
}

export async function sendConversationReplyAction(formData: FormData) {
  const path = "/inbox";
  const parsed = messageSchema.safeParse({
    body: requiredString(formData, "body"),
    channel: requiredString(formData, "channel") || "inbox",
    conversationId: requiredString(formData, "conversationId"),
  });

  if (!parsed.success) {
    redirectWithError(
      path,
      parsed.error.issues[0]?.message ?? "Mensaje invalido.",
    );
  }

  const { supabase, userId } = await getMutationContext(path);

  try {
    await sendConversationReply(supabase, parsed.data, userId);
  } catch (error) {
    redirectWithError(
      path,
      mutationMessage(error, "No se ha podido enviar el mensaje."),
    );
  }

  revalidatePath("/inbox");
  revalidatePath("/dashboard");
  redirect(`/inbox/${parsed.data.conversationId}?sent=1`);
}
