import type { PricingObservationInput } from "@wiahost/shared";
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
