import { reservations as demoReservations } from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Relation<T> = T | T[] | null | undefined;

type LeadRow = {
  channel: string;
  check_in: string;
  check_out: string;
  conversations?: Relation<{
    id: string;
    last_message_at: string | null;
    status: string;
  }>;
  created_at: string;
  guests?: Relation<{
    email: string | null;
    full_name: string | null;
    phone: string | null;
  }>;
  id: string;
  notes: string | null;
  payments?: Relation<{
    amount: number | string | null;
    created_at: string;
    provider: string;
    status: string;
  }>;
  properties?: Relation<{ name: string | null }>;
  status: string;
  total_amount: number | string | null;
};

export type DirectLeadItem = {
  amount: string;
  channel: string;
  conversationId?: string;
  createdAt: string;
  dates: string;
  email: string;
  guest: string;
  id: string;
  message: string;
  payment: string;
  paymentRequested: boolean;
  phone: string;
  property: string;
  status: string;
  waiting: string;
};

const fallbackLeads: DirectLeadItem[] = [
  {
    amount: demoReservations[2]?.amount ?? "980 EUR",
    channel: "Directo",
    conversationId: "demo-conversation-3",
    createdAt: "Demo",
    dates: demoReservations[2]?.dates ?? "4 may - 9 may",
    email: "marta@example.com",
    guest: demoReservations[2]?.guest ?? "Marta Costa",
    id: "demo-direct-lead-1",
    message: "Solicitud directa pendiente de revision.",
    payment: "Sin solicitud",
    paymentRequested: false,
    phone: "+34 600 000 000",
    property: demoReservations[2]?.property ?? "Sea View Valencia",
    status: "Consulta",
    waiting: "Demo",
  },
];

const statusLabels: Record<string, string> = {
  cancelled: "Cancelada",
  confirmed: "Confirmada",
  inquiry: "Consulta",
  pending: "Pendiente",
};

const channelLabels: Record<string, string> = {
  direct: "Directo",
  manual: "Manual",
};

const paymentLabels: Record<string, string> = {
  authorized: "Autorizado",
  disputed: "Disputa",
  failed: "Fallido",
  paid: "Pagado",
  pending: "Pendiente",
  refunded: "Reembolsado",
};

function one<T>(relation: Relation<T>): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation ?? null;
}

function label(value: string | null | undefined) {
  if (!value) {
    return "Pendiente";
  }

  return statusLabels[value] ?? channelLabels[value] ?? value;
}

function money(value: number | string | null) {
  const amount = Number(value ?? 0);
  return `${Math.round(amount)} EUR`;
}

function shortDate(value: string | null | undefined) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function dateRange(checkIn: string, checkOut: string) {
  return `${shortDate(checkIn)} - ${shortDate(checkOut)}`;
}

function waitingSince(value: string | null | undefined) {
  if (!value) {
    return "Sin actividad";
  }

  const minutes = Math.max(
    1,
    Math.round((Date.now() - new Date(value).getTime()) / 60_000),
  );

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.round(minutes / 60);
  return `${hours} h`;
}

function mapLead(row: LeadRow): DirectLeadItem {
  const guest = one(row.guests);
  const conversation = one(row.conversations);
  const payments = Array.isArray(row.payments)
    ? row.payments
    : row.payments
      ? [row.payments]
      : [];
  const payment =
    payments.find((item) => item.provider === "direct_checkout") ??
    payments[0] ??
    null;

  return {
    amount: money(row.total_amount),
    channel: label(row.channel),
    conversationId: conversation?.id,
    createdAt: shortDate(row.created_at),
    dates: dateRange(row.check_in, row.check_out),
    email: guest?.email ?? "Sin email",
    guest: guest?.full_name ?? "Contacto sin nombre",
    id: row.id,
    message: row.notes ?? "Solicitud directa sin mensaje adicional.",
    payment: payment
      ? (paymentLabels[payment.status] ?? payment.status)
      : "Sin solicitud",
    paymentRequested: Boolean(payment),
    phone: guest?.phone ?? "Sin telefono",
    property: one(row.properties)?.name ?? "Propiedad sin asignar",
    status: label(row.status),
    waiting: waitingSince(conversation?.last_message_at ?? row.created_at),
  };
}

export async function getDirectLeads(): Promise<DirectLeadItem[]> {
  if (!isSupabaseConfigured()) {
    return fallbackLeads;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("reservations")
      .select(
        "id,channel,status,check_in,check_out,total_amount,notes,created_at,properties(name),guests(full_name,email,phone),conversations(id,status,last_message_at),payments(status,provider,amount,created_at)",
      )
      .eq("channel", "direct")
      .in("status", ["inquiry", "pending", "confirmed", "cancelled"])
      .order("created_at", { ascending: false })
      .limit(100);

    if (error || !data) {
      return fallbackLeads;
    }

    return (data as LeadRow[]).map(mapLead);
  } catch {
    return fallbackLeads;
  }
}
