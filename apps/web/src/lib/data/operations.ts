import {
  automationRules as demoAutomationRules,
  calendarDays as demoCalendarDays,
  calendarMatrix as demoCalendarMatrix,
  channelHealth as demoChannelHealth,
  executiveMetrics as demoExecutiveMetrics,
  inboxThreads as demoInboxThreads,
  incidents as demoIncidents,
  operationQueue as demoOperationQueue,
  properties as demoProperties,
  reservations as demoReservations,
  tasks as demoTasks,
} from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ExecutiveMetric = (typeof demoExecutiveMetrics)[number];
export type CalendarDay = (typeof demoCalendarDays)[number];
export type CalendarMatrixRow = (typeof demoCalendarMatrix)[number];
export type ChannelHealthItem = (typeof demoChannelHealth)[number];
export type OperationQueueItem = (typeof demoOperationQueue)[number];
export type ReservationListItem = (typeof demoReservations)[number];
export type InboxThreadItem = (typeof demoInboxThreads)[number];
export type TaskListItem = (typeof demoTasks)[number];
export type IncidentListItem = (typeof demoIncidents)[number];
export type AutomationRuleItem = (typeof demoAutomationRules)[number];

export type SelectOption = {
  id: string;
  label: string;
  helper?: string;
};

export type OperationFormOptions = {
  properties: SelectOption[];
  reservations: SelectOption[];
};

export type DashboardData = {
  executiveMetrics: ExecutiveMetric[];
  calendarDays: CalendarDay[];
  calendarMatrix: CalendarMatrixRow[];
  channelHealth: ChannelHealthItem[];
  operationQueue: OperationQueueItem[];
  reservations: ReservationListItem[];
  inboxThreads: InboxThreadItem[];
  tasks: TaskListItem[];
  incidents: IncidentListItem[];
  automationRules: AutomationRuleItem[];
};

type Relation<T> = T | T[] | null | undefined;

type ReservationRow = {
  id: string;
  property_id?: string;
  channel: string;
  status: string;
  check_in: string;
  check_out: string;
  total_amount: number | string | null;
  properties?: Relation<{ id?: string; name: string | null; internal_name?: string | null; city?: string | null }>;
  guests?: Relation<{ full_name: string | null }>;
};

type ConversationRow = {
  id: string;
  status: string;
  last_message_at: string | null;
  properties?: Relation<{ name: string | null }>;
  guests?: Relation<{ full_name: string | null }>;
  reservations?: Relation<{ channel: string | null; check_in: string | null }>;
};

type MessageRow = {
  conversation_id: string;
  channel: string;
  body: string;
  sent_at: string;
  direction: string;
};

type TaskRow = {
  id: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  due_at: string | null;
  properties?: Relation<{ name: string | null }>;
};

type IncidentRow = {
  id: string;
  title: string;
  status: string;
  severity: string;
  estimated_cost: number | string | null;
  properties?: Relation<{ name: string | null }>;
};

type PropertyCalendarRow = {
  id: string;
  name: string;
  internal_name: string | null;
};

type AutomationRuleRow = {
  id: string;
  name: string;
  trigger: string;
  enabled: boolean;
  delay_minutes: number;
};

const statusLabels: Record<string, string> = {
  active: "Activo",
  archived: "Archivado",
  blocked: "Bloqueada",
  cancelled: "Cancelada",
  charged: "Cargada",
  checked_in: "En estancia",
  checked_out: "Check-out",
  confirmed: "Confirmada",
  critical: "Critica",
  done: "Cerrada",
  draft: "Borrador",
  failed: "Error",
  high: "Alta",
  in_progress: "En curso",
  investigating: "Investigando",
  inquiry: "Consulta",
  low: "Baja",
  medium: "Media",
  no_show: "No show",
  open: "Abierta",
  paused: "Pausado",
  pending: "Pendiente",
  pending_guest: "Pendiente huesped",
  pending_team: "Pendiente equipo",
  resolved: "Resuelta",
  scheduled: "Programada",
};

const channelLabels: Record<string, string> = {
  airbnb: "Airbnb",
  booking: "Booking",
  direct: "Directo",
  email: "Email",
  expedia: "Expedia",
  google_vacation_rentals: "Google",
  inbox: "Inbox",
  manual: "Manual",
  sms: "SMS",
  vrbo: "Vrbo",
  whatsapp: "WhatsApp",
};

const taskTypeLabels: Record<string, string> = {
  admin: "Administracion",
  cleaning: "Limpieza",
  guest_request: "Peticion huesped",
  inspection: "Inspeccion",
  maintenance: "Mantenimiento",
};

function label(value: string | null | undefined) {
  if (!value) {
    return "Pendiente";
  }

  return statusLabels[value] ?? channelLabels[value] ?? taskTypeLabels[value] ?? value;
}

function one<T>(relation: Relation<T>): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation ?? null;
}

function money(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0);
  const safeValue = Number.isFinite(numeric) ? numeric : 0;
  return `${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 }).format(safeValue)} EUR`;
}

function parseMoney(value: string) {
  const normalized = value.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  return Number(normalized) || 0;
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short" }).format(new Date(value));
}

function dateRange(checkIn: string, checkOut: string) {
  return `${shortDate(checkIn)} - ${shortDate(checkOut)}`;
}

function waitingSince(value: string | null | undefined) {
  if (!value) {
    return "Sin fecha";
  }

  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000));

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.round(minutes / 60);
  return `${hours} h`;
}

function dueLabel(value: string | null | undefined) {
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

function isCriticalTask(task: TaskListItem) {
  return ["Alta", "Critica", "Media"].includes(task.priority) && !["Cerrada", "Cancelada"].includes(task.status);
}

function buildChannelHealth(reservations: ReservationListItem[]): ChannelHealthItem[] {
  const grouped = new Map<string, { bookings: number; revenue: number }>();

  for (const reservation of reservations) {
    const current = grouped.get(reservation.channel) ?? { bookings: 0, revenue: 0 };
    current.bookings += 1;
    current.revenue += parseMoney(reservation.amount);
    grouped.set(reservation.channel, current);
  }

  return Array.from(grouped.entries()).map(([channel, values]) => ({
    bookings: values.bookings,
    channel,
    health: Math.max(78, Math.min(99, 88 + values.bookings * 2)),
    revenue: money(values.revenue),
    sync: channel === "Directo" ? "Motor activo" : "Sincronizado",
  }));
}

function buildOperationQueue({
  inboxThreads,
  incidents,
  tasks,
}: {
  inboxThreads: InboxThreadItem[];
  incidents: IncidentListItem[];
  tasks: TaskListItem[];
}): OperationQueueItem[] {
  const inboxItems = inboxThreads.slice(0, 2).map((thread) => ({
    description: `${thread.property} - ${thread.channel}`,
    due: thread.waiting,
    label: `Responder a ${thread.guest}`,
    priority: thread.status,
    type: "Inbox",
  }));

  const taskItems = tasks.filter(isCriticalTask).slice(0, 2).map((task) => ({
    description: `${task.property} - ${task.due}`,
    due: task.due,
    label: task.title,
    priority: task.priority,
    type: task.type,
  }));

  const incidentItems = incidents.slice(0, 2).map((incident) => ({
    description: `${incident.property} - ${incident.cost}`,
    due: "Revisar hoy",
    label: incident.title,
    priority: incident.severity,
    type: "Incidencia",
  }));

  return [...inboxItems, ...taskItems, ...incidentItems].slice(0, 4);
}

function buildExecutiveMetrics({
  inboxThreads,
  incidents,
  reservations,
  tasks,
}: {
  inboxThreads: InboxThreadItem[];
  incidents: IncidentListItem[];
  reservations: ReservationListItem[];
  tasks: TaskListItem[];
}): ExecutiveMetric[] {
  const activeReservations = reservations.filter((reservation) => !["Cancelada", "No show"].includes(reservation.status));
  const revenue = reservations.reduce((total, reservation) => total + parseMoney(reservation.amount), 0);
  const riskCount =
    inboxThreads.filter((thread) => ["Urgente", "Alta"].includes(thread.status)).length +
    tasks.filter(isCriticalTask).length +
    incidents.filter((incident) => !["Resuelta", "Cancelada"].includes(incident.status)).length;

  return [
    { helper: "Reservas no canceladas", label: "Reservas activas", tone: "neutral", value: String(activeReservations.length) },
    { helper: "Total confirmado visible", label: "Ingresos", tone: "positive", value: money(revenue) },
    { helper: "Mensajes pendientes", label: "SLA inbox", tone: inboxThreads.length ? "warning" : "positive", value: inboxThreads.length ? inboxThreads[0].waiting : "OK" },
    { helper: "Acciones operativas", label: "Riesgo operativo", tone: riskCount ? "warning" : "positive", value: String(riskCount) },
  ];
}

function buildCalendarDays(): CalendarDay[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);

    return {
      date: new Intl.DateTimeFormat("es-ES", { day: "2-digit" }).format(date),
      day: new Intl.DateTimeFormat("es-ES", { weekday: "short" }).format(date).replace(".", ""),
      events: [],
    };
  });
}

function buildCalendarMatrix(properties: PropertyCalendarRow[], reservations: ReservationRow[], days: CalendarDay[]): CalendarMatrixRow[] {
  const dateKeys = days.map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    return date.toISOString().slice(0, 10);
  });

  return properties.slice(0, 4).map((property) => ({
    cells: dateKeys.map((dateKey) => {
      const reservation = reservations.find(
        (item) => item.property_id === property.id && item.check_in <= dateKey && item.check_out >= dateKey,
      );

      if (!reservation) {
        return "Libre";
      }

      if (reservation.check_in === dateKey) {
        return `Check-in - ${label(reservation.channel)}`;
      }

      if (reservation.check_out === dateKey) {
        return "Check-out";
      }

      return "Ocupado";
    }),
    code: property.internal_name ?? property.id.slice(0, 8),
    property: property.name,
  }));
}

export async function getReservations(): Promise<ReservationListItem[]> {
  if (!isSupabaseConfigured()) {
    return demoReservations;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("reservations")
      .select("id,channel,status,check_in,check_out,total_amount,properties(name),guests(full_name)")
      .order("check_in", { ascending: true })
      .limit(12);

    if (error || !data) {
      return demoReservations;
    }

    return (data as ReservationRow[]).map((reservation) => ({
      amount: money(reservation.total_amount),
      channel: label(reservation.channel),
      dates: dateRange(reservation.check_in, reservation.check_out),
      guest: one(reservation.guests)?.full_name ?? "Huesped sin nombre",
      id: reservation.id,
      property: one(reservation.properties)?.name ?? "Propiedad sin asignar",
      status: label(reservation.status),
    }));
  } catch {
    return demoReservations;
  }
}

export async function getInboxThreads(): Promise<InboxThreadItem[]> {
  if (!isSupabaseConfigured()) {
    return demoInboxThreads;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const [{ data: conversations, error: conversationsError }, { data: messages, error: messagesError }] = await Promise.all([
      supabase
        .from("conversations")
        .select("id,status,last_message_at,properties(name),guests(full_name),reservations(channel,check_in)")
        .order("last_message_at", { ascending: false })
        .limit(12),
      supabase
        .from("conversation_messages")
        .select("conversation_id,channel,body,sent_at,direction")
        .order("sent_at", { ascending: false })
        .limit(40),
    ]);

    if (conversationsError || messagesError || !conversations) {
      return demoInboxThreads;
    }

    const latestMessageByConversation = new Map<string, MessageRow>();
    for (const message of (messages ?? []) as MessageRow[]) {
      if (!latestMessageByConversation.has(message.conversation_id)) {
        latestMessageByConversation.set(message.conversation_id, message);
      }
    }

    return (conversations as ConversationRow[]).map((conversation) => {
      const latestMessage = latestMessageByConversation.get(conversation.id);
      const reservation = one(conversation.reservations);

      return {
        channel: label(latestMessage?.channel ?? reservation?.channel ?? "inbox"),
        guest: one(conversation.guests)?.full_name ?? "Contacto sin nombre",
        id: conversation.id,
        message: latestMessage?.body ?? "Sin mensajes recientes.",
        property: one(conversation.properties)?.name ?? "Propiedad sin asignar",
        status: conversation.status === "open" ? "Urgente" : label(conversation.status),
        waiting: waitingSince(latestMessage?.sent_at ?? conversation.last_message_at),
      };
    });
  } catch {
    return demoInboxThreads;
  }
}

export async function getTasks(): Promise<TaskListItem[]> {
  if (!isSupabaseConfigured()) {
    return demoTasks;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("tasks")
      .select("id,title,type,status,priority,due_at,properties(name)")
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(12);

    if (error || !data) {
      return demoTasks;
    }

    return (data as TaskRow[]).map((task) => ({
      due: dueLabel(task.due_at),
      id: task.id,
      priority: label(task.priority),
      property: one(task.properties)?.name ?? "Propiedad sin asignar",
      status: label(task.status),
      title: task.title,
      type: label(task.type),
    }));
  } catch {
    return demoTasks;
  }
}

export async function getIncidents(): Promise<IncidentListItem[]> {
  if (!isSupabaseConfigured()) {
    return demoIncidents;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("incidents")
      .select("id,title,status,severity,estimated_cost,properties(name)")
      .order("created_at", { ascending: false })
      .limit(12);

    if (error || !data) {
      return demoIncidents;
    }

    return (data as IncidentRow[]).map((incident) => ({
      cost: incident.estimated_cost ? `${money(incident.estimated_cost)} estimados` : "Coste pendiente",
      id: incident.id,
      property: one(incident.properties)?.name ?? "Propiedad sin asignar",
      severity: label(incident.severity),
      status: label(incident.status),
      title: incident.title,
    }));
  } catch {
    return demoIncidents;
  }
}

export async function getOperationFormOptions(): Promise<OperationFormOptions> {
  const fallbackOptions = {
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
  };

  if (!isSupabaseConfigured()) {
    return fallbackOptions;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const [{ data: properties }, { data: reservations }] = await Promise.all([
      supabase.from("properties").select("id,name,city,internal_name").order("name", { ascending: true }),
      supabase
        .from("reservations")
        .select("id,check_in,check_out,properties(name),guests(full_name)")
        .order("check_in", { ascending: false })
        .limit(50),
    ]);

    return {
      properties: ((properties ?? []) as PropertyCalendarRow[]).map((property) => ({
        helper: property.internal_name ?? property.id.slice(0, 8),
        id: property.id,
        label: property.name,
      })),
      reservations: ((reservations ?? []) as ReservationRow[]).map((reservation) => ({
        helper: dateRange(reservation.check_in, reservation.check_out),
        id: reservation.id,
        label: `${one(reservation.guests)?.full_name ?? "Huesped"} - ${one(reservation.properties)?.name ?? "Propiedad"}`,
      })),
    };
  } catch {
    return fallbackOptions;
  }
}

async function getAutomationRules(): Promise<AutomationRuleItem[]> {
  if (!isSupabaseConfigured()) {
    return demoAutomationRules;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("automation_rules")
      .select("id,name,trigger,enabled,delay_minutes")
      .order("created_at", { ascending: false })
      .limit(6);

    if (error || !data) {
      return demoAutomationRules;
    }

    return (data as AutomationRuleRow[]).map((rule) => ({
      impact: rule.delay_minutes ? `${rule.delay_minutes} min de espera` : "Ejecucion inmediata",
      name: rule.name,
      status: rule.enabled ? "Activa" : "Pausada",
      trigger: label(rule.trigger),
    }));
  } catch {
    return demoAutomationRules;
  }
}

export async function getDashboardData(): Promise<DashboardData> {
  if (!isSupabaseConfigured()) {
    return {
      automationRules: demoAutomationRules,
      calendarDays: demoCalendarDays,
      calendarMatrix: demoCalendarMatrix,
      channelHealth: demoChannelHealth,
      executiveMetrics: demoExecutiveMetrics,
      inboxThreads: demoInboxThreads,
      incidents: demoIncidents,
      operationQueue: demoOperationQueue,
      reservations: demoReservations,
      tasks: demoTasks,
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const [reservations, inboxThreads, tasks, incidents, automationRules, { data: properties }, { data: calendarReservations }] =
      await Promise.all([
        getReservations(),
        getInboxThreads(),
        getTasks(),
        getIncidents(),
        getAutomationRules(),
        supabase.from("properties").select("id,name,internal_name").order("created_at", { ascending: false }).limit(4),
        supabase.from("reservations").select("id,property_id,channel,status,check_in,check_out,total_amount").limit(80),
      ]);

    const calendarDays = buildCalendarDays();
    const calendarMatrix = buildCalendarMatrix(
      (properties ?? []) as PropertyCalendarRow[],
      (calendarReservations ?? []) as ReservationRow[],
      calendarDays,
    );

    return {
      automationRules,
      calendarDays: calendarMatrix.length ? calendarDays : demoCalendarDays,
      calendarMatrix: calendarMatrix.length ? calendarMatrix : demoCalendarMatrix,
      channelHealth: reservations.length ? buildChannelHealth(reservations) : demoChannelHealth,
      executiveMetrics: buildExecutiveMetrics({ inboxThreads, incidents, reservations, tasks }),
      inboxThreads,
      incidents,
      operationQueue: buildOperationQueue({ inboxThreads, incidents, tasks }),
      reservations,
      tasks,
    };
  } catch {
    return {
      automationRules: demoAutomationRules,
      calendarDays: demoCalendarDays,
      calendarMatrix: demoCalendarMatrix,
      channelHealth: demoChannelHealth,
      executiveMetrics: demoExecutiveMetrics,
      inboxThreads: demoInboxThreads,
      incidents: demoIncidents,
      operationQueue: demoOperationQueue,
      reservations: demoReservations,
      tasks: demoTasks,
    };
  }
}
