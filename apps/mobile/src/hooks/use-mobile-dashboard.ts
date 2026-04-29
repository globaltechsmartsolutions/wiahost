import { useQuery } from "@tanstack/react-query";

import {
  demoInbox,
  demoIncidents,
  demoMetrics,
  demoProperties,
  demoQueue,
  demoReservations,
} from "@/src/lib/demo-data";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";

export type MobileMetric = (typeof demoMetrics)[number];
export type MobileProperty = (typeof demoProperties)[number];
export type MobileReservation = (typeof demoReservations)[number];
export type MobileIncident = (typeof demoIncidents)[number];
export type MobileInboxThread = (typeof demoInbox)[number];
export type MobileQueueItem = {
  entityType: "inbox" | "incident" | "task";
  id: string;
  label: string;
  meta: string;
  priority: string;
};

export type MobileDashboardData = {
  inbox: MobileInboxThread[];
  incidents: MobileIncident[];
  metrics: MobileMetric[];
  properties: MobileProperty[];
  queue: MobileQueueItem[];
  reservations: MobileReservation[];
};

const statusLabels: Record<string, string> = {
  active: "Activo",
  archived: "Archivado",
  cancelled: "Cancelada",
  checked_in: "En estancia",
  confirmed: "Confirmada",
  draft: "Borrador",
  high: "Alta",
  investigating: "Investigando",
  medium: "Media",
  open: "Abierta",
  paused: "Pausado",
  pending: "Pendiente",
  pending_guest: "Pendiente huesped",
  pending_team: "Pendiente equipo",
  resolved: "Resuelta",
  scheduled: "Programada",
  done: "Cerrada",
};

const channelLabels: Record<string, string> = {
  airbnb: "Airbnb",
  booking: "Booking",
  direct: "Directo",
  manual: "Manual",
  vrbo: "Vrbo",
  whatsapp: "WhatsApp",
};

function label(value: string | null | undefined) {
  if (!value) {
    return "Pendiente";
  }

  return statusLabels[value] ?? channelLabels[value] ?? value;
}

function money(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return `${new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0)} EUR`;
}

function shortDate(value: string | null | undefined) {
  if (!value) {
    return "sin fecha";
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function fallbackData(): MobileDashboardData {
  return {
    inbox: demoInbox,
    incidents: demoIncidents,
    metrics: demoMetrics,
    properties: demoProperties,
    queue: demoQueue as MobileQueueItem[],
    reservations: demoReservations,
  };
}

async function loadMobileDashboard(): Promise<MobileDashboardData> {
  if (!isSupabaseConfigured()) {
    return fallbackData();
  }

  try {
    const [
      { data: properties },
      { data: reservations },
      { data: incidents },
      { data: conversations },
      { data: tasks },
    ] = await Promise.all([
      supabase
        .from("properties")
        .select("id,name,internal_name,city,status,base_price")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("reservations")
        .select("id,channel,status,check_in,check_out,total_amount,properties(name),guests(full_name)")
        .order("check_in", { ascending: true })
        .limit(20),
      supabase
        .from("incidents")
        .select("id,title,status,severity,estimated_cost,properties(name)")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("conversations")
        .select("id,status,last_message_at,properties(name),guests(full_name),reservations(channel)")
        .order("last_message_at", { ascending: false })
        .limit(10),
      supabase
        .from("tasks")
        .select("id,title,status,priority,due_at,properties(name)")
        .order("due_at", { ascending: true, nullsFirst: false })
        .limit(10),
    ]);

    const mappedProperties: MobileProperty[] = (properties ?? []).map((property) => ({
      basePrice: Number(property.base_price ?? 0),
      city: property.city,
      id: property.id,
      internalName: property.internal_name ?? property.id.slice(0, 8),
      name: property.name,
      status: label(property.status),
    }));

    const mappedReservations: MobileReservation[] = ((reservations ?? []) as Array<{
      channel: string | null;
      check_in: string | null;
      check_out: string | null;
      guests?: { full_name: string | null } | { full_name: string | null }[] | null;
      id: string;
      properties?: { name: string | null } | { name: string | null }[] | null;
      status: string | null;
      total_amount: number | string | null;
    }>).map((reservation) => {
      const property = Array.isArray(reservation.properties)
        ? reservation.properties[0]
        : reservation.properties;
      const guest = Array.isArray(reservation.guests)
        ? reservation.guests[0]
        : reservation.guests;

      return {
        amount: money(reservation.total_amount),
        channel: label(reservation.channel),
        dates: `${shortDate(reservation.check_in)} - ${shortDate(reservation.check_out)}`,
        guest: guest?.full_name ?? "Huesped sin nombre",
        id: reservation.id,
        property: property?.name ?? "Propiedad sin asignar",
        status: label(reservation.status),
        statusValue: reservation.status ?? "pending",
      };
    });

    const mappedIncidents: MobileIncident[] = ((incidents ?? []) as Array<{
      estimated_cost: number | string | null;
      id: string;
      properties?: { name: string | null } | { name: string | null }[] | null;
      severity: string | null;
      status: string | null;
      title: string;
    }>).map((incident) => {
      const property = Array.isArray(incident.properties)
        ? incident.properties[0]
        : incident.properties;

      return {
        cost: incident.estimated_cost ? `${money(incident.estimated_cost)} estimados` : "Coste pendiente",
        id: incident.id,
        property: property?.name ?? "Propiedad sin asignar",
        severity: label(incident.severity),
        status: label(incident.status),
        statusValue: incident.status ?? "open",
        title: incident.title,
      };
    });

    const mappedInbox: MobileInboxThread[] = ((conversations ?? []) as Array<{
      guests?: { full_name: string | null } | { full_name: string | null }[] | null;
      id: string;
      last_message_at: string | null;
      properties?: { name: string | null } | { name: string | null }[] | null;
      reservations?: { channel: string | null } | { channel: string | null }[] | null;
      status: string | null;
    }>).map((conversation) => {
      const property = Array.isArray(conversation.properties)
        ? conversation.properties[0]
        : conversation.properties;
      const guest = Array.isArray(conversation.guests)
        ? conversation.guests[0]
        : conversation.guests;
      const reservation = Array.isArray(conversation.reservations)
        ? conversation.reservations[0]
        : conversation.reservations;

      return {
        channel: label(reservation?.channel ?? "inbox"),
        guest: guest?.full_name ?? "Contacto sin nombre",
        id: conversation.id,
        message: "Mensaje pendiente de revisar desde el panel.",
        property: property?.name ?? "Propiedad sin asignar",
        status: label(conversation.status),
        waiting: conversation.last_message_at ? shortDate(conversation.last_message_at) : "Sin fecha",
      };
    });

    const mappedQueue: MobileQueueItem[] = [
      ...mappedInbox.slice(0, 1).map((thread) => ({
        entityType: "inbox" as const,
        id: thread.id,
        label: `Responder a ${thread.guest}`,
        meta: `${thread.property} - ${thread.channel}`,
        priority: thread.status,
      })),
      ...((tasks ?? []) as Array<{
        due_at: string | null;
        id: string;
        priority: string | null;
        properties?: { name: string | null } | { name: string | null }[] | null;
        title: string;
      }>)
        .slice(0, 2)
        .map((task) => {
          const property = Array.isArray(task.properties)
            ? task.properties[0]
            : task.properties;

          return {
            entityType: "task" as const,
            id: task.id,
            label: task.title,
            meta: `${property?.name ?? "Propiedad"} - ${shortDate(task.due_at)}`,
            priority: label(task.priority),
          };
        }),
    ];

    const activeReservations = mappedReservations.filter(
      (reservation) => reservation.status !== "Cancelada",
    );
    const revenue = mappedReservations.reduce((total, reservation) => {
      return total + Number(reservation.amount.replace(/[^\d]/g, ""));
    }, 0);
    const riskCount = mappedQueue.length + mappedIncidents.length;

    return {
      inbox: mappedInbox.length ? mappedInbox : demoInbox,
      incidents: mappedIncidents.length ? mappedIncidents : demoIncidents,
      metrics: [
        {
          helper: "Reservas no canceladas",
          label: "Reservas activas",
          value: String(activeReservations.length || demoReservations.length),
        },
        {
          helper: "Total confirmado visible",
          label: "Ingresos",
          value: revenue ? money(revenue) : demoMetrics[1].value,
        },
        {
          helper: "Mensajes pendientes",
          label: "SLA inbox",
          value: mappedInbox.length ? mappedInbox[0].waiting : demoMetrics[2].value,
        },
        {
          helper: "Acciones operativas",
          label: "Riesgo operativo",
          value: String(riskCount || 8),
        },
      ],
      properties: mappedProperties.length ? mappedProperties : demoProperties,
      queue: mappedQueue.length ? mappedQueue : (demoQueue as MobileQueueItem[]),
      reservations: mappedReservations.length ? mappedReservations : demoReservations,
    };
  } catch {
    return fallbackData();
  }
}

export function useMobileDashboard() {
  return useQuery({
    queryFn: loadMobileDashboard,
    queryKey: ["mobile-dashboard"],
  });
}
