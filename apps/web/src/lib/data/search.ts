import {
  inboxThreads as demoInboxThreads,
  incidents as demoIncidents,
  properties as demoProperties,
  reservations as demoReservations,
  tasks as demoTasks,
} from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Relation<T> = T | T[] | null | undefined;

type SearchResult = {
  href: string;
  id: string;
  status?: string;
  subtitle: string;
  title: string;
  type: string;
};

type PropertyRow = {
  city: string | null;
  id: string;
  name: string;
  status: string | null;
};

type GuestRow = {
  email: string | null;
  full_name: string;
  id: string;
  phone: string | null;
};

type ReservationRow = {
  channel: string | null;
  check_in: string | null;
  check_out: string | null;
  guests?: Relation<{ full_name: string | null }>;
  id: string;
  properties?: Relation<{ name: string | null }>;
  status: string | null;
  total_amount: number | string | null;
};

type TaskRow = {
  id: string;
  priority: string | null;
  properties?: Relation<{ name: string | null }>;
  status: string | null;
  title: string;
};

type IncidentRow = {
  id: string;
  properties?: Relation<{ name: string | null }>;
  severity: string | null;
  status: string | null;
  title: string;
};

type ConversationRow = {
  guests?: Relation<{ full_name: string | null }>;
  id: string;
  properties?: Relation<{ name: string | null }>;
  status: string | null;
};

function one<T>(relation: Relation<T>): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation ?? null;
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function matchesQuery(result: SearchResult, query: string) {
  const searchable = normalize(
    `${result.title} ${result.subtitle} ${result.type} ${result.status ?? ""}`,
  );

  return searchable.includes(normalize(query));
}

function compactResults(results: SearchResult[], query: string) {
  const unique = new Map<string, SearchResult>();

  for (const result of results) {
    if (!matchesQuery(result, query)) {
      continue;
    }

    unique.set(`${result.type}:${result.id}`, result);
  }

  return Array.from(unique.values()).slice(0, 40);
}

function fallbackSearch(query: string): SearchResult[] {
  return compactResults(
    [
      ...demoReservations.map((reservation) => ({
        href: `/reservations/${reservation.id}`,
        id: reservation.id,
        status: reservation.status,
        subtitle: `${reservation.property} · ${reservation.channel} · ${reservation.dates}`,
        title: reservation.guest,
        type: "Reserva",
      })),
      ...demoProperties.map((property) => ({
        href: `/properties/${property.id}`,
        id: property.id,
        status: property.status,
        subtitle: `${property.city} · ${property.channel}`,
        title: property.name,
        type: "Propiedad",
      })),
      ...demoTasks.map((task) => ({
        href: `/tasks/${task.id}`,
        id: task.id,
        status: task.status,
        subtitle: `${task.property} · ${task.type} · ${task.priority}`,
        title: task.title,
        type: "Tarea",
      })),
      ...demoIncidents.map((incident) => ({
        href: `/incidents/${incident.id}`,
        id: incident.id,
        status: incident.status,
        subtitle: `${incident.property} · ${incident.severity} · ${incident.cost}`,
        title: incident.title,
        type: "Incidencia",
      })),
      ...demoInboxThreads.map((thread) => ({
        href: `/inbox/${thread.id}`,
        id: thread.id,
        status: thread.status,
        subtitle: `${thread.property} · ${thread.channel} · ${thread.message}`,
        title: thread.guest,
        type: "Inbox",
      })),
    ],
    query,
  );
}

function money(value: number | string | null) {
  const amount = Number(value ?? 0);

  if (!amount) {
    return "Sin importe";
  }

  return `${amount.toLocaleString("es-ES")} EUR`;
}

export async function searchOperations(query: string): Promise<SearchResult[]> {
  const cleanQuery = query.trim();

  if (cleanQuery.length < 2) {
    return [];
  }

  if (!isSupabaseConfigured()) {
    return fallbackSearch(cleanQuery);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const [
      { data: properties },
      { data: guests },
      { data: reservations },
      { data: tasks },
      { data: incidents },
      { data: conversations },
    ] = await Promise.all([
      supabase
        .from("properties")
        .select("id,name,city,status")
        .order("created_at", { ascending: false })
        .limit(80),
      supabase
        .from("guests")
        .select("id,full_name,email,phone")
        .order("created_at", { ascending: false })
        .limit(80),
      supabase
        .from("reservations")
        .select(
          "id,status,channel,check_in,check_out,total_amount,properties(name),guests(full_name)",
        )
        .order("created_at", { ascending: false })
        .limit(80),
      supabase
        .from("tasks")
        .select("id,title,status,priority,properties(name)")
        .order("created_at", { ascending: false })
        .limit(80),
      supabase
        .from("incidents")
        .select("id,title,status,severity,properties(name)")
        .order("created_at", { ascending: false })
        .limit(80),
      supabase
        .from("conversations")
        .select("id,status,properties(name),guests(full_name)")
        .order("last_message_at", { ascending: false })
        .limit(80),
    ]);

    const results: SearchResult[] = [
      ...((reservations ?? []) as ReservationRow[]).map((reservation) => ({
        href: `/reservations/${reservation.id}`,
        id: reservation.id,
        status: reservation.status ?? undefined,
        subtitle: `${one(reservation.properties)?.name ?? "Propiedad"} · ${reservation.channel ?? "Canal"} · ${reservation.check_in ?? "Sin check-in"} · ${money(reservation.total_amount)}`,
        title: one(reservation.guests)?.full_name ?? "Reserva sin huesped",
        type: "Reserva",
      })),
      ...((properties ?? []) as PropertyRow[]).map((property) => ({
        href: `/properties/${property.id}`,
        id: property.id,
        status: property.status ?? undefined,
        subtitle: property.city ?? "Sin ciudad",
        title: property.name,
        type: "Propiedad",
      })),
      ...((guests ?? []) as GuestRow[]).map((guest) => ({
        href: `/guests/${guest.id}`,
        id: guest.id,
        subtitle: [guest.email, guest.phone].filter(Boolean).join(" · "),
        title: guest.full_name,
        type: "Huesped",
      })),
      ...((tasks ?? []) as TaskRow[]).map((task) => ({
        href: `/tasks/${task.id}`,
        id: task.id,
        status: task.status ?? undefined,
        subtitle: `${one(task.properties)?.name ?? "Sin propiedad"} · ${task.priority ?? "Sin prioridad"}`,
        title: task.title,
        type: "Tarea",
      })),
      ...((incidents ?? []) as IncidentRow[]).map((incident) => ({
        href: `/incidents/${incident.id}`,
        id: incident.id,
        status: incident.status ?? undefined,
        subtitle: `${one(incident.properties)?.name ?? "Sin propiedad"} · ${incident.severity ?? "Sin severidad"}`,
        title: incident.title,
        type: "Incidencia",
      })),
      ...((conversations ?? []) as ConversationRow[]).map((conversation) => ({
        href: `/inbox/${conversation.id}`,
        id: conversation.id,
        status: conversation.status ?? undefined,
        subtitle: one(conversation.properties)?.name ?? "Sin propiedad",
        title: one(conversation.guests)?.full_name ?? "Conversacion",
        type: "Inbox",
      })),
    ];

    return compactResults(results, cleanQuery);
  } catch {
    return fallbackSearch(cleanQuery);
  }
}

export type { SearchResult };
