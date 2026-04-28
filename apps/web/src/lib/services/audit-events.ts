import type { Json } from "@wiahost/database";
import type { OperationalEventInput } from "@wiahost/shared";
import type { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

export class AuditEventMutationError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function mutationError(code: string, message: string): never {
  throw new AuditEventMutationError(code, message);
}

function optionalValue(value: string | undefined) {
  return value?.trim() ? value.trim() : null;
}

function toDatabaseDateTime(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function toEventPayload(input: OperationalEventInput, userId: string) {
  return {
    actor_profile_id: optionalValue(input.actorProfileId) ?? userId,
    actor_type: input.actorType,
    conversation_id: optionalValue(input.conversationId),
    entity_id: optionalValue(input.entityId),
    entity_type: input.entityType.trim(),
    event_name: input.eventName.trim(),
    incident_id: optionalValue(input.incidentId),
    metadata: input.metadata as Json,
    occurred_at: toDatabaseDateTime(input.occurredAt),
    property_id: optionalValue(input.propertyId),
    reservation_id: optionalValue(input.reservationId),
    source: input.source.trim(),
    task_id: optionalValue(input.taskId),
  };
}

export async function createAuditEvent(
  supabase: SupabaseServerClient,
  input: OperationalEventInput,
  userId: string,
) {
  const { data, error } = await supabase
    .from("operational_events")
    .insert(toEventPayload(input, userId))
    .select("id,event_name,entity_type")
    .single();

  if (error || !data) {
    mutationError(
      "audit_event_create_failed",
      "No se ha podido crear el evento de auditoria.",
    );
  }

  return data;
}

export async function deleteAuditEvent(
  supabase: SupabaseServerClient,
  eventId: string,
) {
  const { data, error } = await supabase
    .from("operational_events")
    .delete()
    .eq("id", eventId)
    .select("id")
    .single();

  if (error || !data) {
    mutationError(
      "audit_event_delete_failed",
      "No se ha podido eliminar el evento de auditoria.",
    );
  }

  return data;
}
