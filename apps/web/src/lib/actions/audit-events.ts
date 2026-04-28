"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { operationalEventSchema } from "@wiahost/shared";
import { z } from "zod";

import {
  AuditEventMutationError,
  createAuditEvent,
  deleteAuditEvent,
} from "@/lib/services/audit-events";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const idSchema = z.guid();

function redirectWithError(message: string): never {
  redirect(`/audit?error=${encodeURIComponent(message)}`);
}

async function requireAuditEventContext() {
  if (!isSupabaseConfigured()) {
    redirectWithError("Supabase no esta configurado.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect(
      `/login?error=${encodeURIComponent("Inicia sesion para auditar eventos.")}`,
    );
  }

  return { supabase, userId: userData.user.id };
}

function optionalString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value ? value : undefined;
}

function optionalDateTime(formData: FormData, key: string) {
  const value = optionalString(formData, key);

  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function eventInputFromForm(formData: FormData) {
  const note = optionalString(formData, "metadataNote");

  return {
    actorType: "user",
    entityId: optionalString(formData, "entityId"),
    entityType: formData.get("entityType"),
    eventName: formData.get("eventName"),
    incidentId: optionalString(formData, "incidentId"),
    metadata: note ? { note } : {},
    occurredAt: optionalDateTime(formData, "occurredAt"),
    propertyId: optionalString(formData, "propertyId"),
    reservationId: optionalString(formData, "reservationId"),
    source: formData.get("source") || "web",
    taskId: optionalString(formData, "taskId"),
  };
}

export async function createAuditEventAction(formData: FormData) {
  const parsed = operationalEventSchema.safeParse(eventInputFromForm(formData));

  if (!parsed.success) {
    redirectWithError(parsed.error.issues[0]?.message ?? "Evento no valido.");
  }

  const { supabase, userId } = await requireAuditEventContext();

  try {
    await createAuditEvent(supabase, parsed.data, userId);
  } catch (error) {
    if (error instanceof AuditEventMutationError) {
      redirectWithError(error.message);
    }

    redirectWithError("No se ha podido crear el evento de auditoria.");
  }

  revalidatePath("/audit");
  redirect("/audit?created=1");
}

export async function deleteAuditEventAction(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "");
  const validEventId = idSchema.safeParse(eventId);

  if (!validEventId.success) {
    redirectWithError("El identificador de evento no es valido.");
  }

  const { supabase } = await requireAuditEventContext();

  try {
    await deleteAuditEvent(supabase, validEventId.data);
  } catch (error) {
    if (error instanceof AuditEventMutationError) {
      redirectWithError(error.message);
    }

    redirectWithError("No se ha podido eliminar el evento de auditoria.");
  }

  revalidatePath("/audit");
  redirect("/audit?deleted=1");
}
