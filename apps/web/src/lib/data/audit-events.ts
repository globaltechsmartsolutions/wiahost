import type { Json } from "@wiahost/database";

import {
  incidents as demoIncidents,
  properties as demoProperties,
  reservations as demoReservations,
  tasks as demoTasks,
} from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Relation<T> = T | T[] | null | undefined;

type OperationalEventRow = {
  actor_type: string;
  conversation_id: string | null;
  created_at: string;
  entity_id: string | null;
  entity_type: string;
  event_name: string;
  id: string;
  incident_id: string | null;
  incidents?: Relation<{ title: string | null }>;
  metadata: Json;
  occurred_at: string;
  profiles?: Relation<{ full_name: string | null }>;
  property_id: string | null;
  properties?: Relation<{ name: string | null }>;
  reservation_id: string | null;
  reservations?: Relation<{
    check_in: string | null;
    check_out: string | null;
    guests?: Relation<{ full_name: string | null }>;
    properties?: Relation<{ name: string | null }>;
  }>;
  source: string;
  task_id: string | null;
  tasks?: Relation<{ title: string | null }>;
};

type PropertyOptionRow = {
  id: string;
  internal_name: string | null;
  name: string;
};

type ReservationOptionRow = {
  check_in: string | null;
  check_out: string | null;
  guests?: Relation<{ full_name: string | null }>;
  id: string;
  properties?: Relation<{ name: string | null }>;
};

type IncidentOptionRow = {
  id: string;
  properties?: Relation<{ name: string | null }>;
  title: string;
};

type TaskOptionRow = {
  id: string;
  properties?: Relation<{ name: string | null }>;
  title: string;
};

export type AuditEventListItem = {
  actor: string;
  actorType: string;
  context: string;
  entity: string;
  id: string;
  metadataSummary: string;
  occurredAt: string;
  raw: {
    conversationId?: string;
    entityId?: string;
    entityType: string;
    eventName: string;
    incidentId?: string;
    propertyId?: string;
    reservationId?: string;
    source: string;
    taskId?: string;
  };
  source: string;
  title: string;
};

export type AuditEventFormOptions = {
  incidents: Array<{ helper?: string; id: string; label: string }>;
  properties: Array<{ helper?: string; id: string; label: string }>;
  reservations: Array<{ helper?: string; id: string; label: string }>;
  tasks: Array<{ helper?: string; id: string; label: string }>;
};

const fallbackEvents: AuditEventListItem[] = [
  {
    actor: "Laura Operaciones",
    actorType: "Usuario",
    context: "Reserva: Sofia Martin - Atico Gran Via Sky",
    entity: "reservation",
    id: "demo-audit-event-1",
    metadataSummary: "Evento demo para validar trazabilidad.",
    occurredAt: "Demo",
    raw: {
      entityType: "reservation",
      eventName: "reservation.confirmed",
      propertyId: demoProperties[0]?.id,
      reservationId: demoReservations[0]?.id,
      source: "web",
    },
    source: "web",
    title: "reservation.confirmed",
  },
];

const actorLabels: Record<string, string> = {
  automation: "Automatizacion",
  model: "Modelo",
  system: "Sistema",
  user: "Usuario",
};

function one<T>(relation: Relation<T>): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation ?? null;
}

function shortDate(value: string | null | undefined) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function dateRange(
  checkIn: string | null | undefined,
  checkOut: string | null | undefined,
) {
  if (!checkIn || !checkOut) {
    return "Sin fechas";
  }

  return `${shortDate(checkIn)} - ${shortDate(checkOut)}`;
}

function metadataSummary(metadata: Json) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return "Sin metadata adicional";
  }

  const entries = Object.entries(metadata).slice(0, 3);
  if (!entries.length) {
    return "Sin metadata adicional";
  }

  return entries
    .map(([key, value]) => `${key}: ${String(value).slice(0, 80)}`)
    .join(" · ");
}

function buildContext(row: OperationalEventRow) {
  const reservation = one(row.reservations);
  const incident = one(row.incidents);
  const task = one(row.tasks);

  if (reservation && row.reservation_id) {
    const guest = one(reservation.guests)?.full_name ?? "Huesped";
    const property = one(reservation.properties)?.name ?? "Propiedad";
    return `Reserva: ${guest} - ${property}`;
  }

  if (incident && row.incident_id) {
    return `Incidencia: ${incident.title ?? "Sin titulo"}`;
  }

  if (task && row.task_id) {
    return `Tarea: ${task.title ?? "Sin titulo"}`;
  }

  if (row.property_id) {
    return `Propiedad: ${one(row.properties)?.name ?? "Sin nombre"}`;
  }

  return "Evento general de operaciones";
}

function mapEvent(row: OperationalEventRow): AuditEventListItem {
  return {
    actor: one(row.profiles)?.full_name ?? "Sistema WIAHost",
    actorType: actorLabels[row.actor_type] ?? row.actor_type,
    context: buildContext(row),
    entity: row.entity_type,
    id: row.id,
    metadataSummary: metadataSummary(row.metadata),
    occurredAt: shortDate(row.occurred_at),
    raw: {
      conversationId: row.conversation_id ?? undefined,
      entityId: row.entity_id ?? undefined,
      entityType: row.entity_type,
      eventName: row.event_name,
      incidentId: row.incident_id ?? undefined,
      propertyId: row.property_id ?? undefined,
      reservationId: row.reservation_id ?? undefined,
      source: row.source,
      taskId: row.task_id ?? undefined,
    },
    source: row.source,
    title: row.event_name,
  };
}

export async function getAuditEvents(): Promise<AuditEventListItem[]> {
  if (!isSupabaseConfigured()) {
    return fallbackEvents;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("operational_events")
      .select(
        "id,event_name,entity_type,entity_id,actor_type,source,metadata,occurred_at,created_at,property_id,reservation_id,conversation_id,task_id,incident_id,profiles(full_name),properties(name),reservations(check_in,check_out,properties(name),guests(full_name)),tasks(title),incidents(title)",
      )
      .order("occurred_at", { ascending: false })
      .limit(120);

    if (error || !data) {
      return fallbackEvents;
    }

    return (data as OperationalEventRow[]).map(mapEvent);
  } catch {
    return fallbackEvents;
  }
}

export async function getAuditEventDetail(
  eventId: string,
): Promise<AuditEventListItem | null> {
  if (!isSupabaseConfigured()) {
    return fallbackEvents.find((event) => event.id === eventId) ?? null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("operational_events")
      .select(
        "id,event_name,entity_type,entity_id,actor_type,source,metadata,occurred_at,created_at,property_id,reservation_id,conversation_id,task_id,incident_id,profiles(full_name),properties(name),reservations(check_in,check_out,properties(name),guests(full_name)),tasks(title),incidents(title)",
      )
      .eq("id", eventId)
      .single();

    if (error || !data) {
      return null;
    }

    return mapEvent(data as OperationalEventRow);
  } catch {
    return null;
  }
}

export async function getAuditEventFormOptions(): Promise<AuditEventFormOptions> {
  const fallbackOptions = {
    incidents: demoIncidents.map((incident) => ({
      helper: incident.property,
      id: incident.id,
      label: incident.title,
    })),
    properties: demoProperties.map((property) => ({
      helper: property.city,
      id: property.id,
      label: property.name,
    })),
    reservations: demoReservations.map((reservation) => ({
      helper: reservation.dates,
      id: reservation.id,
      label: `${reservation.guest} - ${reservation.property}`,
    })),
    tasks: demoTasks.map((task) => ({
      helper: task.property,
      id: task.id,
      label: task.title,
    })),
  };

  if (!isSupabaseConfigured()) {
    return fallbackOptions;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const [
      { data: properties },
      { data: reservations },
      { data: incidents },
      { data: tasks },
    ] = await Promise.all([
      supabase
        .from("properties")
        .select("id,name,internal_name")
        .neq("status", "archived")
        .order("name", { ascending: true }),
      supabase
        .from("reservations")
        .select("id,check_in,check_out,properties(name),guests(full_name)")
        .order("check_in", { ascending: false })
        .limit(80),
      supabase
        .from("incidents")
        .select("id,title,properties(name)")
        .order("created_at", { ascending: false })
        .limit(80),
      supabase
        .from("tasks")
        .select("id,title,properties(name)")
        .order("created_at", { ascending: false })
        .limit(80),
    ]);

    return {
      incidents: ((incidents ?? []) as IncidentOptionRow[]).map((incident) => ({
        helper: one(incident.properties)?.name ?? "Sin propiedad",
        id: incident.id,
        label: incident.title,
      })),
      properties: ((properties ?? []) as PropertyOptionRow[]).map(
        (property) => ({
          helper: property.internal_name ?? property.id.slice(0, 8),
          id: property.id,
          label: property.name,
        }),
      ),
      reservations: ((reservations ?? []) as ReservationOptionRow[]).map(
        (reservation) => ({
          helper: dateRange(reservation.check_in, reservation.check_out),
          id: reservation.id,
          label: `${one(reservation.guests)?.full_name ?? "Huesped"} - ${one(reservation.properties)?.name ?? "Propiedad"}`,
        }),
      ),
      tasks: ((tasks ?? []) as TaskOptionRow[]).map((task) => ({
        helper: one(task.properties)?.name ?? "Sin propiedad",
        id: task.id,
        label: task.title,
      })),
    };
  } catch {
    return fallbackOptions;
  }
}
