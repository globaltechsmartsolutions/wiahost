import type { ChannelSyncEventInput, ListingInput } from "@wiahost/shared";
import type { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

export class DistributionMutationError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function mutationError(code: string, message: string): never {
  throw new DistributionMutationError(code, message);
}

function optionalValue(value: string | undefined) {
  return value?.trim() ? value.trim() : null;
}

function toListingPayload(input: ListingInput) {
  return {
    channel: input.channel,
    channel_url: optionalValue(input.channelUrl),
    external_listing_id: optionalValue(input.externalListingId),
    property_id: input.propertyId,
    public_slug: optionalValue(input.publicSlug),
    status: input.status,
    sync_enabled: input.syncEnabled,
    sync_notes: optionalValue(input.syncNotes),
    title: input.title.trim(),
  };
}

function toSyncEventPayload(input: ChannelSyncEventInput) {
  return {
    channel: input.channel,
    direction: input.direction,
    error_message: optionalValue(input.errorMessage),
    listing_id: optionalValue(input.listingId),
    payload: input.payload,
    property_id: optionalValue(input.propertyId),
    status: input.status,
  };
}

export async function createListing(
  supabase: SupabaseServerClient,
  input: ListingInput,
) {
  const { data, error } = await supabase
    .from("property_listings")
    .insert(toListingPayload(input))
    .select("id,title,status")
    .single();

  if (error || !data) {
    mutationError(
      "listing_create_failed",
      "No se ha podido crear la publicacion.",
    );
  }

  return data;
}

export async function updateListing(
  supabase: SupabaseServerClient,
  listingId: string,
  input: ListingInput,
) {
  const { data, error } = await supabase
    .from("property_listings")
    .update(toListingPayload(input))
    .eq("id", listingId)
    .select("id,title,status")
    .single();

  if (error || !data) {
    mutationError(
      "listing_update_failed",
      "No se ha podido actualizar la publicacion.",
    );
  }

  return data;
}

export async function deleteListing(
  supabase: SupabaseServerClient,
  listingId: string,
) {
  const { data, error } = await supabase
    .from("property_listings")
    .delete()
    .eq("id", listingId)
    .select("id")
    .single();

  if (error || !data) {
    mutationError(
      "listing_delete_failed",
      "No se ha podido eliminar la publicacion.",
    );
  }

  return data;
}

export async function createSyncEvent(
  supabase: SupabaseServerClient,
  input: ChannelSyncEventInput,
) {
  const { data, error } = await supabase
    .from("channel_sync_events")
    .insert(toSyncEventPayload(input))
    .select("id,status,channel")
    .single();

  if (error || !data) {
    mutationError(
      "sync_event_create_failed",
      "No se ha podido registrar el evento de sincronizacion.",
    );
  }

  return data;
}
