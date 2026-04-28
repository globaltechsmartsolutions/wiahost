import type { Json } from "@wiahost/database";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Relation<T> = T | T[] | null | undefined;

type GuestRow = {
  email: string | null;
  full_name: string;
  id: string;
  phone: string | null;
  preferred_language: string;
  tags: Json;
};

type ReservationRow = {
  check_in: string;
  guest_id: string;
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
