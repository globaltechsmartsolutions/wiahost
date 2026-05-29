import { notFound } from "next/navigation";

import { properties as demoProperties } from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type Relation<T> = T | T[] | null | undefined;

type PublicListingRow = {
  channel: string;
  external_listing_id: string | null;
  id: string;
  properties?: Relation<{
    address_line: string | null;
    amenities: unknown;
    base_price: number | null;
    bathrooms: number | null;
    bedrooms: number | null;
    city: string | null;
    cleaning_fee: number | null;
    country: string | null;
    description: string | null;
    house_rules: string | null;
    id: string;
    max_guests: number | null;
    name: string | null;
    province: string | null;
  }>;
  property_id: string;
  public_slug: string | null;
  status: string;
  sync_notes: string | null;
  title: string;
};

export type PublicBookingListing = {
  address: string;
  amenities: string[];
  basePrice: number;
  bathrooms: number;
  bedrooms: number;
  channel: string;
  cleaningFee: number;
  description: string;
  externalListingId: string;
  houseRules: string;
  id: string;
  maxGuests: number;
  partnerId: string;
  propertyId: string;
  propertyName: string;
  slug: string;
  syncNotes: string;
  thumbnailUrl: string;
  title: string;
};

export type PublicBookingListingFilters = {
  destination?: string;
  guests?: number | null;
  partner?: string;
};

const fallbackListing: PublicBookingListing = {
  address: "Malaga Centro, Spain",
  amenities: ["wifi", "self_checkin", "ac"],
  basePrice: 120,
  bathrooms: 1,
  bedrooms: 1,
  channel: "direct",
  cleaningFee: 40,
  description:
    "Loft urbano preparado para estancias cortas con check-in autonomo y soporte operativo WIAHost.",
  externalListingId: "direct-demo-2",
  houseRules:
    "Respeta el descanso de vecinos, no fiestas y salida antes de la hora acordada.",
  id: "demo-direct-listing",
  maxGuests: 2,
  partnerId: "demo",
  propertyId: demoProperties[1]?.id ?? "demo-property",
  propertyName: demoProperties[1]?.name ?? "Loft Malaga Centro",
  slug: "loft-malaga-centro",
  syncNotes: "Reserva directa gestionada por WIAHost.",
  thumbnailUrl: "",
  title: "Loft Malaga Centro",
};

function normalizeSearchText(value: string | undefined) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function one<T>(relation: Relation<T>): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation ?? null;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => stringValue(item))
    .filter((item) => item.length > 0);
}

function parseListingMetadata(syncNotes: string | null) {
  const trimmed = syncNotes?.trim() ?? "";

  if (!trimmed.startsWith("{")) {
    return {
      amenities: [],
      externalListingId: "",
      notes: trimmed,
      partnerId: "",
      thumbnailUrl: "",
    };
  }

  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;

    return {
      amenities: stringArray(parsed.amenities),
      externalListingId: stringValue(parsed.externalListingId),
      notes: stringValue(parsed.notes ?? parsed.syncNotes),
      partnerId: stringValue(parsed.partnerId ?? parsed.partner),
      thumbnailUrl: stringValue(parsed.thumbnailUrl),
    };
  } catch {
    return {
      amenities: [],
      externalListingId: "",
      notes: trimmed,
      partnerId: "",
      thumbnailUrl: "",
    };
  }
}

function matchesPublicListingFilters(
  listing: PublicBookingListing,
  filters: PublicBookingListingFilters,
) {
  const guests = filters.guests ?? null;

  if (guests && listing.maxGuests < guests) {
    return false;
  }

  const partner = normalizeSearchText(filters.partner);

  if (partner && normalizeSearchText(listing.partnerId) !== partner) {
    return false;
  }

  const destination = normalizeSearchText(filters.destination);

  if (!destination) {
    return true;
  }

  return normalizeSearchText(
    [
      listing.address,
      listing.amenities.join(" "),
      listing.channel,
      listing.description,
      listing.propertyName,
      listing.syncNotes,
      listing.title,
    ].join(" "),
  ).includes(destination);
}

function mapPublicListing(row: PublicListingRow): PublicBookingListing | null {
  const property = one(row.properties);

  if (!property || !row.public_slug) {
    return null;
  }

  const metadata = parseListingMetadata(row.sync_notes);
  const amenities = metadata.amenities.length
    ? metadata.amenities
    : stringArray(property.amenities);

  return {
    address: [property.city, property.province, property.country]
      .filter(Boolean)
      .join(", "),
    amenities,
    basePrice: property.base_price ?? 0,
    bathrooms: property.bathrooms ?? 0,
    bedrooms: property.bedrooms ?? 0,
    channel: row.channel,
    cleaningFee: property.cleaning_fee ?? 0,
    description:
      property.description ??
      "Alojamiento gestionado profesionalmente por WIAHost.",
    externalListingId: row.external_listing_id ?? metadata.externalListingId,
    houseRules:
      property.house_rules ??
      "Solicitud sujeta a revision del equipo antes de confirmarse.",
    id: row.id,
    maxGuests: property.max_guests ?? 1,
    partnerId: metadata.partnerId,
    propertyId: row.property_id,
    propertyName: property.name ?? row.title,
    slug: row.public_slug,
    syncNotes:
      metadata.notes || "Solicitud directa gestionada por WIAHost.",
    thumbnailUrl: metadata.thumbnailUrl,
    title: row.title,
  };
}

export async function getPublicBookingListings(
  filters: PublicBookingListingFilters = {},
): Promise<PublicBookingListing[]> {
  if (!isSupabaseConfigured()) {
    return matchesPublicListingFilters(fallbackListing, filters)
      ? [fallbackListing]
      : [];
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("property_listings")
      .select(
        "id,property_id,channel,external_listing_id,public_slug,title,status,sync_notes,properties(id,name,description,address_line,city,province,country,amenities,base_price,cleaning_fee,bedrooms,bathrooms,max_guests,house_rules)",
      )
      .eq("status", "published")
      .not("public_slug", "is", null)
      .order("created_at", { ascending: false });

    if (error || !data) {
      return matchesPublicListingFilters(fallbackListing, filters)
        ? [fallbackListing]
        : [];
    }

    return (data as PublicListingRow[])
      .map(mapPublicListing)
      .filter((listing): listing is PublicBookingListing => Boolean(listing))
      .filter((listing) => matchesPublicListingFilters(listing, filters));
  } catch {
    return matchesPublicListingFilters(fallbackListing, filters)
      ? [fallbackListing]
      : [];
  }
}

export async function getPublicBookingListing(
  slug: string,
  filters: PublicBookingListingFilters = {},
): Promise<PublicBookingListing | null> {
  if (!isSupabaseConfigured()) {
    return slug === fallbackListing.slug &&
      matchesPublicListingFilters(fallbackListing, filters)
      ? fallbackListing
      : null;
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("property_listings")
      .select(
        "id,property_id,channel,external_listing_id,public_slug,title,status,sync_notes,properties(id,name,description,address_line,city,province,country,amenities,base_price,cleaning_fee,bedrooms,bathrooms,max_guests,house_rules)",
      )
      .eq("public_slug", slug)
      .eq("status", "published")
      .single();

    if (error || !data) {
      return slug === fallbackListing.slug ? fallbackListing : null;
    }

    const listing = mapPublicListing(data as PublicListingRow);

    return listing && matchesPublicListingFilters(listing, filters)
      ? listing
      : null;
  } catch {
    return slug === fallbackListing.slug &&
      matchesPublicListingFilters(fallbackListing, filters)
      ? fallbackListing
      : null;
  }
}

export async function requirePublicBookingListing(slug: string) {
  const listing = await getPublicBookingListing(slug);

  if (!listing) {
    notFound();
  }

  return listing;
}
