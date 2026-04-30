import { useQuery } from "@tanstack/react-query";

import { demoReservations } from "@/src/lib/demo-data";
import { readOfflineCache, writeOfflineCache } from "@/src/lib/offline-cache";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";

type Relation<T> = T | T[] | null | undefined;

export type MobileReservationDetail = {
  amount: string;
  cachedAt?: string;
  channel: string;
  dates: string;
  guest: string;
  id: string;
  property: string;
  source: "cache" | "demo" | "live";
  status: string;
  statusValue: string;
};

const reservationDetailCacheKey = (reservationId: string) =>
  `reservation-detail-v1:${reservationId}`;

const statusLabels: Record<string, string> = {
  cancelled: "Cancelada",
  checked_in: "En estancia",
  checked_out: "Check-out",
  confirmed: "Confirmada",
  inquiry: "Consulta",
  no_show: "No show",
  pending: "Pendiente",
};

const channelLabels: Record<string, string> = {
  airbnb: "Airbnb",
  booking: "Booking",
  direct: "Directo",
  manual: "Manual",
  vrbo: "Vrbo",
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

function fallbackReservation(
  reservationId: string,
): MobileReservationDetail | null {
  const reservation = demoReservations.find(
    (item) => item.id === reservationId,
  );

  if (!reservation) {
    return null;
  }

  return {
    ...reservation,
    source: "demo",
  };
}

async function cachedReservation(reservationId: string) {
  const cached = await readOfflineCache<MobileReservationDetail>(
    reservationDetailCacheKey(reservationId),
  );

  if (!cached) {
    return null;
  }

  return {
    ...cached.value,
    cachedAt: cached.savedAt,
    source: "cache" as const,
  };
}

async function loadReservationDetail(
  reservationId: string,
): Promise<MobileReservationDetail | null> {
  if (!isSupabaseConfigured()) {
    return fallbackReservation(reservationId);
  }

  try {
    const { data, error } = await supabase
      .from("reservations")
      .select(
        "id,channel,status,check_in,check_out,total_amount,properties(name),guests(full_name)",
      )
      .eq("id", reservationId)
      .single();

    if (error || !data) {
      return fallbackReservation(reservationId);
    }

    const row = data as {
      channel: string | null;
      check_in: string | null;
      check_out: string | null;
      guests?: Relation<{ full_name: string | null }>;
      id: string;
      properties?: Relation<{ name: string | null }>;
      status: string | null;
      total_amount: number | string | null;
    };
    const detail = {
      amount: money(row.total_amount),
      channel: label(row.channel),
      dates: `${shortDate(row.check_in)} - ${shortDate(row.check_out)}`,
      guest: one(row.guests)?.full_name ?? "Huesped sin nombre",
      id: row.id,
      property: one(row.properties)?.name ?? "Propiedad sin asignar",
      source: "live" as const,
      status: label(row.status),
      statusValue: row.status ?? "pending",
    };

    await writeOfflineCache(reservationDetailCacheKey(reservationId), detail);

    return detail;
  } catch {
    return (
      (await cachedReservation(reservationId)) ??
      fallbackReservation(reservationId)
    );
  }
}

export function useReservationDetail(reservationId: string | undefined) {
  return useQuery({
    enabled: Boolean(reservationId),
    queryFn: () => loadReservationDetail(reservationId ?? ""),
    queryKey: ["reservation-detail", reservationId],
  });
}
