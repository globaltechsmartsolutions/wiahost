import { bookingChannels, type PricingObservationInput } from "@wiahost/shared";
import type { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

export class PricingMutationError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function mutationError(code: string, message: string): never {
  throw new PricingMutationError(code, message);
}

function optionalNumber(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toPricingPayload(input: PricingObservationInput) {
  return {
    approved_price: optionalNumber(input.approvedPrice),
    booking_pace: optionalNumber(input.bookingPace),
    conversion_status: input.conversionStatus,
    currency: input.currency.toUpperCase(),
    current_price: optionalNumber(input.currentPrice),
    final_price: optionalNumber(input.finalPrice),
    lead_time_days: optionalNumber(input.leadTimeDays),
    metadata: {
      source: "manual_pricing_control",
    },
    observed_for: input.observedFor,
    occupancy_rate: optionalNumber(input.occupancyRate),
    property_id: input.propertyId,
    reservation_id: input.reservationId ?? null,
    source: input.source,
    suggested_price: optionalNumber(input.suggestedPrice),
  };
}

function channelFromSource(source: string) {
  const normalized = source.trim().toLowerCase();

  return bookingChannels.includes(
    normalized as (typeof bookingChannels)[number],
  )
    ? normalized
    : "manual";
}

export async function createPricingObservation(
  supabase: SupabaseServerClient,
  input: PricingObservationInput,
) {
  const { data, error } = await supabase
    .from("pricing_observations")
    .insert(toPricingPayload(input))
    .select("id,source,observed_for")
    .single();

  if (error || !data) {
    mutationError(
      "pricing_observation_create_failed",
      "No se ha podido crear la observacion de precio.",
    );
  }

  return data;
}

export async function syncPricingObservation(
  supabase: SupabaseServerClient,
  observationId: string,
) {
  const { data: observation, error: observationError } = await supabase
    .from("pricing_observations")
    .select(
      "id,property_id,reservation_id,observed_for,source,current_price,suggested_price,approved_price,final_price,currency,metadata",
    )
    .eq("id", observationId)
    .single();

  if (observationError || !observation) {
    mutationError(
      "pricing_observation_not_found",
      "No se ha encontrado la observacion de precio.",
    );
  }

  const selectedPrice =
    observation.approved_price ??
    observation.final_price ??
    observation.suggested_price ??
    observation.current_price;

  if (selectedPrice === null || selectedPrice === undefined) {
    mutationError(
      "pricing_sync_price_missing",
      "Define un precio aprobado, final, sugerido o actual antes de sincronizar.",
    );
  }

  const channel = channelFromSource(observation.source);
  const amount = Number(selectedPrice);
  const metadata =
    observation.metadata &&
    typeof observation.metadata === "object" &&
    !Array.isArray(observation.metadata)
      ? observation.metadata
      : {};

  const { data: syncEvent, error: syncError } = await supabase
    .from("channel_sync_events")
    .insert({
      channel,
      direction: "outbound",
      payload: {
        action: "price_update",
        amount,
        currency: observation.currency,
        observationId,
        observedFor: observation.observed_for,
        reservationId: observation.reservation_id,
        source: observation.source,
      },
      property_id: observation.property_id,
      status: "pending",
    })
    .select("id,status,channel")
    .single();

  if (syncError || !syncEvent) {
    mutationError(
      "pricing_sync_event_failed",
      "No se ha podido registrar la sincronizacion de precio.",
    );
  }

  await supabase
    .from("pricing_observations")
    .update({
      metadata: {
        ...metadata,
        lastSyncEventId: syncEvent.id,
        lastSyncRequestedAt: new Date().toISOString(),
        lastSyncStatus: syncEvent.status,
      },
    })
    .eq("id", observationId);

  return syncEvent;
}

export async function updatePricingObservation(
  supabase: SupabaseServerClient,
  observationId: string,
  input: PricingObservationInput,
) {
  const { data, error } = await supabase
    .from("pricing_observations")
    .update(toPricingPayload(input))
    .eq("id", observationId)
    .select("id,source,observed_for")
    .single();

  if (error || !data) {
    mutationError(
      "pricing_observation_update_failed",
      "No se ha podido actualizar la observacion de precio.",
    );
  }

  return data;
}

export async function deletePricingObservation(
  supabase: SupabaseServerClient,
  observationId: string,
) {
  const { data, error } = await supabase
    .from("pricing_observations")
    .delete()
    .eq("id", observationId)
    .select("id")
    .single();

  if (error || !data) {
    mutationError(
      "pricing_observation_delete_failed",
      "No se ha podido eliminar la observacion de precio.",
    );
  }

  return data;
}
