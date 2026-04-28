import type { Json } from "@wiahost/database";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Relation<T> = T | T[] | null | undefined;

type GuestRow = {
  created_at?: string | null;
  email: string | null;
  full_name: string;
  id: string;
  notes?: string | null;
  phone: string | null;
  preferred_language: string;
  tags: Json;
  updated_at?: string | null;
};

type ReservationRow = {
  check_in: string;
  check_out?: string;
  channel?: string;
  guest_id: string;
  id?: string;
  properties?: Relation<{ name: string | null }>;
  status: string;
  total_amount?: number | string | null;
};

type ConversationRow = {
  id: string;
  last_message_at: string | null;
  properties?: Relation<{ name: string | null }>;
  status: string;
};

export type GuestListItem = {
  email: string;
  id: string;
  language: string;
  latestContext: string;
  name: string;
  phone: string;
  reservationCount: number;
  tags: string[];
};

export type GuestReservationItem = {
  amount: string;
  channel: string;
  dates: string;
  id: string;
  property: string;
  status: string;
};

export type GuestConversationItem = {
  id: string;
  lastActivity: string;
  property: string;
  status: string;
};

export type GuestDetail = GuestListItem & {
  conversations: GuestConversationItem[];
  createdAt: string;
  notes: string;
  raw: {
    email: string;
    fullName: string;
    notes: string;
    phone: string;
    preferredLanguage: string;
  };
  reservations: GuestReservationItem[];
};

const fallbackGuests: GuestListItem[] = [
  {
    email: "sofia@example.com",
    id: "demo-guest-1",
    language: "es",
    latestContext: "Proxima llegada manana en Atico Gran Via Sky",
    name: "Sofia Martin",
    phone: "+34600000001",
    reservationCount: 2,
    tags: ["repeat_guest"],
  },
  {
    email: "james@example.com",
    id: "demo-guest-2",
    language: "en",
    latestContext: "En estancia en Loft Malaga Centro",
    name: "James Walker",
    phone: "+447000000001",
    reservationCount: 1,
    tags: ["vip"],
  },
];

const fallbackGuestDetails: GuestDetail[] = fallbackGuests.map((guest) => ({
  ...guest,
  conversations:
    guest.id === "demo-guest-1"
      ? [
          {
            id: "demo-conversation-1",
            lastActivity: "Hace 20 min",
            property: "Atico Gran Via Sky",
            status: "Urgente",
          },
        ]
      : [],
  createdAt: "Demo",
  notes:
    guest.id === "demo-guest-1"
      ? "Prefiere check-in autonomo y comunicacion por WhatsApp."
      : "Huesped VIP con preferencia por late checkout.",
  raw: {
    email: guest.email === "Sin email" ? "" : guest.email,
    fullName: guest.name,
    notes:
      guest.id === "demo-guest-1"
        ? "Prefiere check-in autonomo y comunicacion por WhatsApp."
        : "Huesped VIP con preferencia por late checkout.",
    phone: guest.phone === "Sin telefono" ? "" : guest.phone,
    preferredLanguage: guest.language,
  },
  reservations: [
    {
      amount: guest.id === "demo-guest-1" ? "645 EUR" : "420 EUR",
      channel: guest.id === "demo-guest-1" ? "Airbnb" : "Directo",
      dates: "Proxima estancia",
      id: `${guest.id}-reservation`,
      property:
        guest.id === "demo-guest-1"
          ? "Atico Gran Via Sky"
          : "Loft Malaga Centro",
      status: guest.id === "demo-guest-1" ? "Confirmada" : "En estancia",
    },
  ],
}));

function one<T>(relation: Relation<T>): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation ?? null;
}

function parseTags(tags: Json): string[] {
  return Array.isArray(tags)
    ? tags.filter((tag): tag is string => typeof tag === "string")
    : [];
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    cancelled: "cancelada",
    checked_in: "en estancia",
    checked_out: "finalizada",
    confirmed: "confirmada",
    inquiry: "consulta",
    no_show: "no show",
    pending: "pendiente",
  };

  return labels[status] ?? status;
}

function publicStatusLabel(status: string) {
  const labels: Record<string, string> = {
    cancelled: "Cancelada",
    checked_in: "En estancia",
    checked_out: "Finalizada",
    confirmed: "Confirmada",
    inquiry: "Consulta",
    no_show: "No show",
    open: "Urgente",
    pending: "Pendiente",
    pending_guest: "Pendiente huesped",
    pending_team: "Pendiente equipo",
  };

  return labels[status] ?? status;
}

function channelLabel(channel: string | null | undefined) {
  const labels: Record<string, string> = {
    airbnb: "Airbnb",
    booking: "Booking",
    direct: "Directo",
    expedia: "Expedia",
    google_vacation_rentals: "Google",
    manual: "Manual",
    vrbo: "Vrbo",
  };

  return labels[channel ?? ""] ?? "Manual";
}

function money(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0);
  const safeValue = Number.isFinite(numeric) ? numeric : 0;
  return `${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 }).format(safeValue)} EUR`;
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function dateRange(checkIn: string, checkOut: string | undefined) {
  if (!checkOut) {
    return shortDate(checkIn);
  }

  return `${shortDate(checkIn)} - ${shortDate(checkOut)}`;
}

function dateTimeLabel(value: string | null | undefined) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function latestContext(reservations: ReservationRow[]) {
  const latest = reservations
    .slice()
    .sort(
      (first, second) =>
        new Date(second.check_in).getTime() -
        new Date(first.check_in).getTime(),
    )[0];

  if (!latest) {
    return "Sin reservas registradas todavia.";
  }

  return `${statusLabel(latest.status)} en ${one(latest.properties)?.name ?? "propiedad sin asignar"}`;
}

export async function getGuests(): Promise<GuestListItem[]> {
  if (!isSupabaseConfigured()) {
    return fallbackGuests;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const [{ data: guests }, { data: reservations }] = await Promise.all([
      supabase
        .from("guests")
        .select("id,full_name,email,phone,preferred_language,tags")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("reservations")
        .select("guest_id,status,check_in,properties(name)")
        .order("check_in", { ascending: false })
        .limit(300),
    ]);

    const reservationRows = (reservations ?? []) as ReservationRow[];

    return ((guests ?? []) as GuestRow[]).map((guest) => {
      const guestReservations = reservationRows.filter(
        (reservation) => reservation.guest_id === guest.id,
      );

      return {
        email: guest.email ?? "Sin email",
        id: guest.id,
        language: guest.preferred_language,
        latestContext: latestContext(guestReservations),
        name: guest.full_name,
        phone: guest.phone ?? "Sin telefono",
        reservationCount: guestReservations.length,
        tags: parseTags(guest.tags),
      };
    });
  } catch {
    return fallbackGuests;
  }
}

export async function getGuestDetail(
  guestId: string,
): Promise<GuestDetail | null> {
  if (!isSupabaseConfigured()) {
    return fallbackGuestDetails.find((guest) => guest.id === guestId) ?? null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const [
      { data: guest, error: guestError },
      { data: reservations },
      { data: conversations },
    ] = await Promise.all([
      supabase
        .from("guests")
        .select(
          "id,full_name,email,phone,preferred_language,notes,tags,created_at,updated_at",
        )
        .eq("id", guestId)
        .single(),
      supabase
        .from("reservations")
        .select(
          "id,guest_id,status,channel,check_in,check_out,total_amount,properties(name)",
        )
        .eq("guest_id", guestId)
        .order("check_in", { ascending: false })
        .limit(20),
      supabase
        .from("conversations")
        .select("id,status,last_message_at,properties(name)")
        .eq("guest_id", guestId)
        .order("last_message_at", { ascending: false })
        .limit(10),
    ]);

    if (guestError || !guest) {
      return null;
    }

    const guestRow = guest as GuestRow;
    const reservationRows = (reservations ?? []) as ReservationRow[];
    const conversationRows = (conversations ?? []) as ConversationRow[];
    const listItem: GuestListItem = {
      email: guestRow.email ?? "Sin email",
      id: guestRow.id,
      language: guestRow.preferred_language,
      latestContext: latestContext(reservationRows),
      name: guestRow.full_name,
      phone: guestRow.phone ?? "Sin telefono",
      reservationCount: reservationRows.length,
      tags: parseTags(guestRow.tags),
    };

    return {
      ...listItem,
      conversations: conversationRows.map((conversation) => ({
        id: conversation.id,
        lastActivity: dateTimeLabel(conversation.last_message_at),
        property: one(conversation.properties)?.name ?? "Propiedad sin asignar",
        status: publicStatusLabel(conversation.status),
      })),
      createdAt: dateTimeLabel(guestRow.created_at),
      notes: guestRow.notes ?? "Sin notas internas.",
      raw: {
        email: guestRow.email ?? "",
        fullName: guestRow.full_name,
        notes: guestRow.notes ?? "",
        phone: guestRow.phone ?? "",
        preferredLanguage: guestRow.preferred_language,
      },
      reservations: reservationRows.map((reservation) => ({
        amount: money(reservation.total_amount),
        channel: channelLabel(reservation.channel),
        dates: dateRange(reservation.check_in, reservation.check_out),
        id: reservation.id ?? `${guestRow.id}-${reservation.check_in}`,
        property: one(reservation.properties)?.name ?? "Propiedad sin asignar",
        status: publicStatusLabel(reservation.status),
      })),
    };
  } catch {
    return null;
  }
}
