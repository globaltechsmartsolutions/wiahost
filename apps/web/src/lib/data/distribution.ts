import {
  channelHealth as demoChannelHealth,
  properties as demoProperties,
} from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Relation<T> = T | T[] | null | undefined;

type ListingRow = {
  channel: string;
  channel_url: string | null;
  external_listing_id: string | null;
  id: string;
  last_synced_at: string | null;
  properties?: Relation<{
    city: string | null;
    internal_name: string | null;
    name: string | null;
  }>;
  property_id: string;
  public_slug: string | null;
  status: string;
  sync_enabled: boolean;
  sync_notes: string | null;
  title: string;
};

type SyncEventRow = {
  channel: string;
  created_at: string;
  direction: string;
  error_message: string | null;
  id: string;
  listing_id: string | null;
  payload: unknown;
  property_id: string | null;
  property_listings?: Relation<{ title: string | null }>;
  properties?: Relation<{ name: string | null }>;
  status: string;
};

type PropertyOptionRow = {
  city: string | null;
  id: string;
  internal_name: string | null;
  name: string;
};

export type ListingListItem = {
  channel: string;
  channelUrl: string;
  externalListingId: string;
  id: string;
  lastSyncedAt: string;
  property: string;
  raw: {
    channel: string;
    channelUrl?: string;
    externalListingId?: string;
    propertyId: string;
    publicSlug?: string;
    status: string;
    syncEnabled: boolean;
    syncNotes?: string;
    title: string;
  };
  status: string;
  syncEnabled: boolean;
  syncNotes: string;
  title: string;
};

export type SyncEventListItem = {
  channel: string;
  context: string;
  createdAt: string;
  direction: string;
  errorMessage: string;
  id: string;
  payloadSummary: string;
  raw: {
    channel: string;
    direction: string;
    errorMessage?: string;
    listingId?: string;
    payload: unknown;
    propertyId?: string;
    status: string;
  };
  status: string;
};

export type DistributionFormOptions = {
  listings: Array<{ helper?: string; id: string; label: string }>;
  properties: Array<{ helper?: string; id: string; label: string }>;
};

export const channelOptions = [
  { label: "Directo", value: "direct" },
  { label: "Airbnb", value: "airbnb" },
  { label: "Booking.com", value: "booking" },
  { label: "Vrbo", value: "vrbo" },
  { label: "Expedia", value: "expedia" },
  { label: "Google Vacation Rentals", value: "google_vacation_rentals" },
  { label: "Manual", value: "manual" },
];

export const listingStatusOptions = [
  { label: "Borrador", value: "draft" },
  { label: "Publicado", value: "published" },
  { label: "Pausado", value: "paused" },
  { label: "Error sync", value: "sync_error" },
];

export const syncStatusOptions = [
  { label: "Pendiente", value: "pending" },
  { label: "Sincronizado", value: "synced" },
  { label: "Fallido", value: "failed" },
  { label: "Ignorado", value: "ignored" },
];

export const syncDirectionOptions = [
  { label: "Saliente", value: "outbound" },
  { label: "Entrante", value: "inbound" },
];

const fallbackListings: ListingListItem[] = demoChannelHealth.map(
  (channel, index) => ({
    channel: channel.channel,
    channelUrl:
      index === 2
        ? "http://localhost:3002/book/loft-malaga-centro"
        : `https://${channel.channel.toLowerCase().replaceAll(".", "")}.example/listing/demo-${index + 1}`,
    externalListingId: `demo-${index + 1}`,
    id: `demo-listing-${index + 1}`,
    lastSyncedAt: "Demo",
    property: demoProperties[index % demoProperties.length]?.name ?? "Demo",
    raw: {
      channel:
        channel.channel === "Directo"
          ? "direct"
          : channel.channel === "Booking.com"
            ? "booking"
            : channel.channel.toLowerCase(),
      channelUrl:
        index === 2
          ? "http://localhost:3002/book/loft-malaga-centro"
          : `https://${channel.channel.toLowerCase().replaceAll(".", "")}.example/listing/demo-${index + 1}`,
      externalListingId: `demo-${index + 1}`,
      propertyId: demoProperties[index % demoProperties.length]?.id ?? "",
      publicSlug: `demo-listing-${index + 1}`,
      status: channel.sync === "Revisar tarifa" ? "sync_error" : "published",
      syncEnabled: channel.channel !== "Directo",
      syncNotes: channel.sync,
      title: `${demoProperties[index % demoProperties.length]?.name ?? "Demo"} - ${channel.channel}`,
    },
    status: channel.sync === "Revisar tarifa" ? "Error sync" : "Publicado",
    syncEnabled: channel.channel !== "Directo",
    syncNotes: channel.sync,
    title: `${demoProperties[index % demoProperties.length]?.name ?? "Demo"} - ${channel.channel}`,
  }),
);

const fallbackSyncEvents: SyncEventListItem[] = [
  {
    channel: "Airbnb",
    context: "Atico Gran Via Sky - disponibilidad enviada",
    createdAt: "Demo",
    direction: "Saliente",
    errorMessage: "Sin error",
    id: "demo-sync-1",
    payloadSummary: "availability_update",
    raw: {
      channel: "airbnb",
      direction: "outbound",
      listingId: "demo-listing-1",
      payload: { action: "availability_update" },
      status: "synced",
    },
    status: "Sincronizado",
  },
];

function one<T>(relation: Relation<T>): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation ?? null;
}

function labelFromOptions(
  options: Array<{ label: string; value: string }>,
  value: string,
) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function shortDate(value: string | null | undefined) {
  if (!value) {
    return "Nunca";
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function payloadSummary(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return "Sin payload";
  }

  const record = payload as Record<string, unknown>;
  const action = record.action ?? record.event ?? record.type;

  return typeof action === "string"
    ? action
    : `${Object.keys(record).length} campos`;
}

function mapListing(row: ListingRow): ListingListItem {
  const property = one(row.properties);

  return {
    channel: labelFromOptions(channelOptions, row.channel),
    channelUrl: row.channel_url ?? "Sin URL",
    externalListingId: row.external_listing_id ?? "Sin ID externo",
    id: row.id,
    lastSyncedAt: shortDate(row.last_synced_at),
    property: property?.name ?? "Propiedad",
    raw: {
      channel: row.channel,
      channelUrl: row.channel_url ?? undefined,
      externalListingId: row.external_listing_id ?? undefined,
      propertyId: row.property_id,
      publicSlug: row.public_slug ?? undefined,
      status: row.status,
      syncEnabled: row.sync_enabled,
      syncNotes: row.sync_notes ?? undefined,
      title: row.title,
    },
    status: labelFromOptions(listingStatusOptions, row.status),
    syncEnabled: row.sync_enabled,
    syncNotes: row.sync_notes ?? "Sin notas de sincronizacion",
    title: row.title,
  };
}

function mapSyncEvent(row: SyncEventRow): SyncEventListItem {
  const listing = one(row.property_listings);
  const property = one(row.properties);

  return {
    channel: labelFromOptions(channelOptions, row.channel),
    context:
      listing?.title ??
      property?.name ??
      row.property_id ??
      row.listing_id ??
      "Sin contexto",
    createdAt: shortDate(row.created_at),
    direction: labelFromOptions(syncDirectionOptions, row.direction),
    errorMessage: row.error_message ?? "Sin error",
    id: row.id,
    payloadSummary: payloadSummary(row.payload),
    raw: {
      channel: row.channel,
      direction: row.direction,
      errorMessage: row.error_message ?? undefined,
      listingId: row.listing_id ?? undefined,
      payload: row.payload,
      propertyId: row.property_id ?? undefined,
      status: row.status,
    },
    status: labelFromOptions(syncStatusOptions, row.status),
  };
}

export async function getDistributionData() {
  const [listings, syncEvents, options] = await Promise.all([
    getListings(),
    getSyncEvents(),
    getDistributionFormOptions(),
  ]);

  return { listings, options, syncEvents };
}

export async function getListings(): Promise<ListingListItem[]> {
  if (!isSupabaseConfigured()) {
    return fallbackListings;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("property_listings")
      .select(
        "id,property_id,channel,external_listing_id,public_slug,title,status,channel_url,sync_enabled,last_synced_at,sync_notes,properties(name,internal_name,city)",
      )
      .order("updated_at", { ascending: false })
      .limit(100);

    if (error || !data) {
      return fallbackListings;
    }

    return (data as ListingRow[]).map(mapListing);
  } catch {
    return fallbackListings;
  }
}

export async function getListingDetail(
  listingId: string,
): Promise<ListingListItem | null> {
  if (!isSupabaseConfigured()) {
    return fallbackListings.find((listing) => listing.id === listingId) ?? null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("property_listings")
      .select(
        "id,property_id,channel,external_listing_id,public_slug,title,status,channel_url,sync_enabled,last_synced_at,sync_notes,properties(name,internal_name,city)",
      )
      .eq("id", listingId)
      .single();

    if (error || !data) {
      return null;
    }

    return mapListing(data as ListingRow);
  } catch {
    return null;
  }
}

export async function getSyncEvents(): Promise<SyncEventListItem[]> {
  if (!isSupabaseConfigured()) {
    return fallbackSyncEvents;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("channel_sync_events")
      .select(
        "id,property_id,listing_id,channel,status,direction,payload,error_message,created_at,properties(name),property_listings(title)",
      )
      .order("created_at", { ascending: false })
      .limit(50);

    if (error || !data) {
      return fallbackSyncEvents;
    }

    return (data as SyncEventRow[]).map(mapSyncEvent);
  } catch {
    return fallbackSyncEvents;
  }
}

export async function getDistributionFormOptions(): Promise<DistributionFormOptions> {
  const fallbackOptions = {
    listings: fallbackListings.map((listing) => ({
      helper: listing.channel,
      id: listing.id,
      label: listing.title,
    })),
    properties: demoProperties.map((property) => ({
      helper: property.internalName,
      id: property.id,
      label: property.name,
    })),
  };

  if (!isSupabaseConfigured()) {
    return fallbackOptions;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const [{ data: properties }, { data: listings }] = await Promise.all([
      supabase
        .from("properties")
        .select("id,name,internal_name,city")
        .neq("status", "archived")
        .order("name", { ascending: true }),
      supabase
        .from("property_listings")
        .select("id,title,channel")
        .order("title", { ascending: true }),
    ]);

    return {
      listings: (
        (listings ?? []) as Array<{
          channel: string;
          id: string;
          title: string;
        }>
      ).map((listing) => ({
        helper: labelFromOptions(channelOptions, listing.channel),
        id: listing.id,
        label: listing.title,
      })),
      properties: ((properties ?? []) as PropertyOptionRow[]).map(
        (property) => ({
          helper:
            property.internal_name ?? property.city ?? property.id.slice(0, 8),
          id: property.id,
          label: property.name,
        }),
      ),
    };
  } catch {
    return fallbackOptions;
  }
}
