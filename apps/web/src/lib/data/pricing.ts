import { properties as demoProperties } from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Relation<T> = T | T[] | null | undefined;

type PricingObservationRow = {
  approved_price: number | string | null;
  booking_pace: number | string | null;
  conversion_status: string | null;
  currency: string;
  current_price: number | string | null;
  final_price: number | string | null;
  id: string;
  lead_time_days: number | null;
  observed_for: string;
  occupancy_rate: number | string | null;
  properties?: Relation<{ name: string | null }>;
  property_id: string;
  reservation_id: string | null;
  reservations?: Relation<{
    check_in: string | null;
    check_out: string | null;
    guests?: Relation<{ full_name: string | null }>;
  }>;
  source: string;
  suggested_price: number | string | null;
};

export type PricingObservationItem = {
  approvedPrice: string;
  channel: string;
  currentPrice: string;
  delta: string;
  finalPrice: string;
  guestContext: string;
  id: string;
  observedFor: string;
  occupancy: string;
  property: string;
  raw: {
    approvedPrice?: number;
    bookingPace?: number;
    conversionStatus: string;
    currency: string;
    currentPrice?: number;
    finalPrice?: number;
    leadTimeDays?: number;
    observedFor: string;
    occupancyRate?: number;
    propertyId: string;
    reservationId?: string;
    source: string;
    suggestedPrice?: number;
  };
  status: string;
  suggestedPrice: string;
};

export const conversionStatusOptions = [
  { label: "Desconocido", value: "unknown" },
  { label: "Visto", value: "viewed" },
  { label: "Consulta", value: "inquiry" },
  { label: "Reservado", value: "booked" },
  { label: "Perdido", value: "lost" },
  { label: "Cancelado", value: "cancelled" },
];

const fallbackPricing: PricingObservationItem[] = [
  {
    approvedPrice: "170 EUR",
    channel: "airbnb",
    currentPrice: "154 EUR",
    delta: "+16 EUR",
    finalPrice: "170 EUR",
    guestContext: "Sin reserva vinculada",
    id: "demo-pricing-1",
    observedFor: "Demo",
    occupancy: "78%",
    property: demoProperties[0]?.name ?? "Atico Gran Via Sky",
    raw: {
      approvedPrice: 170,
      conversionStatus: "viewed",
      currency: "EUR",
      currentPrice: 154,
      finalPrice: 170,
      observedFor: new Date().toISOString().slice(0, 10),
      occupancyRate: 0.78,
      propertyId: demoProperties[0]?.id ?? "",
      source: "airbnb",
      suggestedPrice: 172,
    },
    status: "Visto",
    suggestedPrice: "172 EUR",
  },
];

function one<T>(relation: Relation<T>): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation ?? null;
}

function numberValue(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function optionalNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function money(value: number | string | null | undefined, currency = "EUR") {
  const parsed = numberValue(value);
  return `${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 }).format(parsed)} ${currency}`;
}

function statusLabel(value: string | null | undefined) {
  return (
    conversionStatusOptions.find((option) => option.value === value)?.label ??
    "Desconocido"
  );
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

function mapPricingObservation(
  row: PricingObservationRow,
): PricingObservationItem {
  const current = numberValue(row.current_price);
  const suggested = numberValue(row.suggested_price);
  const approved = optionalNumber(row.approved_price);
  const reservation = one(row.reservations);
  const guest = one(reservation?.guests);
  const delta = suggested - current;

  return {
    approvedPrice:
      approved === undefined ? "Sin aprobar" : money(approved, row.currency),
    channel: row.source,
    currentPrice: money(row.current_price, row.currency),
    delta: `${delta >= 0 ? "+" : ""}${money(delta, row.currency)}`,
    finalPrice: row.final_price
      ? money(row.final_price, row.currency)
      : "Sin final",
    guestContext: reservation
      ? `${guest?.full_name ?? "Huesped"} - ${shortDate(reservation.check_in)}`
      : "Sin reserva vinculada",
    id: row.id,
    observedFor: shortDate(row.observed_for),
    occupancy:
      row.occupancy_rate === null || row.occupancy_rate === undefined
        ? "Sin ocupacion"
        : `${Math.round(numberValue(row.occupancy_rate) * 100)}%`,
    property: one(row.properties)?.name ?? "Propiedad sin asignar",
    raw: {
      approvedPrice: optionalNumber(row.approved_price),
      bookingPace: optionalNumber(row.booking_pace),
      conversionStatus: row.conversion_status ?? "unknown",
      currency: row.currency,
      currentPrice: optionalNumber(row.current_price),
      finalPrice: optionalNumber(row.final_price),
      leadTimeDays: row.lead_time_days ?? undefined,
      observedFor: row.observed_for,
      occupancyRate: optionalNumber(row.occupancy_rate),
      propertyId: row.property_id,
      reservationId: row.reservation_id ?? undefined,
      source: row.source,
      suggestedPrice: optionalNumber(row.suggested_price),
    },
    status: statusLabel(row.conversion_status),
    suggestedPrice: money(row.suggested_price, row.currency),
  };
}

export async function getPricingObservations(): Promise<
  PricingObservationItem[]
> {
  if (!isSupabaseConfigured()) {
    return fallbackPricing;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("pricing_observations")
      .select(
        "id,property_id,reservation_id,observed_for,source,current_price,suggested_price,approved_price,final_price,currency,occupancy_rate,booking_pace,lead_time_days,conversion_status,properties(name),reservations(check_in,check_out,guests(full_name))",
      )
      .order("observed_for", { ascending: false })
      .limit(100);

    if (error || !data) {
      return fallbackPricing;
    }

    return (data as PricingObservationRow[]).map(mapPricingObservation);
  } catch {
    return fallbackPricing;
  }
}

export async function getPricingObservationDetail(
  observationId: string,
): Promise<PricingObservationItem | null> {
  if (!isSupabaseConfigured()) {
    return fallbackPricing.find((item) => item.id === observationId) ?? null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("pricing_observations")
      .select(
        "id,property_id,reservation_id,observed_for,source,current_price,suggested_price,approved_price,final_price,currency,occupancy_rate,booking_pace,lead_time_days,conversion_status,properties(name),reservations(check_in,check_out,guests(full_name))",
      )
      .eq("id", observationId)
      .single();

    if (error || !data) {
      return null;
    }

    return mapPricingObservation(data as PricingObservationRow);
  } catch {
    return null;
  }
}
