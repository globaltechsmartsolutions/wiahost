import { notFound } from "next/navigation";

import { properties as demoProperties } from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type Relation<T> = T | T[] | null | undefined;

type PublicListingRow = {
  channel: string;
  id: string;
  properties?: Relation<{
    address_line: string | null;
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
  basePrice: number;
  bathrooms: number;
  bedrooms: number;
  channel: string;
  cleaningFee: number;
  description: string;
  houseRules: string;
  id: string;
  maxGuests: number;
  propertyId: string;
  propertyName: string;
  slug: string;
  syncNotes: string;
  title: string;
};

const fallbackListing: PublicBookingListing = {
  address: "Malaga Centro, Spain",
  basePrice: 120,
  bathrooms: 1,
  bedrooms: 1,
  channel: "direct",
  cleaningFee: 40,
  description:
    "Loft urbano preparado para estancias cortas con check-in autonomo y soporte operativo WIAHost.",
  houseRules:
    "Respeta el descanso de vecinos, no fiestas y salida antes de la hora acordada.",
  id: "demo-direct-listing",
  maxGuests: 2,
  propertyId: demoProperties[1]?.id ?? "demo-property",
  propertyName: demoProperties[1]?.name ?? "Loft Malaga Centro",
  slug: "loft-malaga-centro",
  syncNotes: "Reserva directa gestionada por WIAHost.",
  title: "Loft Malaga Centro",
};

function one<T>(relation: Relation<T>): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation ?? null;
}

function mapPublicListing(row: PublicListingRow): PublicBookingListing | null {
  const property = one(row.properties);

  if (!property || !row.public_slug) {
    return null;
  }

  return {
    address: [property.city, property.province, property.country]
      .filter(Boolean)
      .join(", "),
    basePrice: property.base_price ?? 0,
    bathrooms: property.bathrooms ?? 0,
    bedrooms: property.bedrooms ?? 0,
    channel: row.channel,
    cleaningFee: property.cleaning_fee ?? 0,
    description:
      property.description ??
      "Alojamiento gestionado profesionalmente por WIAHost.",
    houseRules:
      property.house_rules ??
      "Solicitud sujeta a revision del equipo antes de confirmarse.",
    id: row.id,
    maxGuests: property.max_guests ?? 1,
    propertyId: row.property_id,
    propertyName: property.name ?? row.title,
    slug: row.public_slug,
    syncNotes: row.sync_notes ?? "Solicitud directa gestionada por WIAHost.",
    title: row.title,
  };
}

export async function getPublicBookingListing(
  slug: string,
): Promise<PublicBookingListing | null> {
  if (!isSupabaseConfigured()) {
    return slug === fallbackListing.slug ? fallbackListing : null;
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("property_listings")
      .select(
        "id,property_id,channel,public_slug,title,status,sync_notes,properties(id,name,description,address_line,city,province,country,base_price,cleaning_fee,bedrooms,bathrooms,max_guests,house_rules)",
      )
      .eq("public_slug", slug)
      .eq("status", "published")
      .single();

    if (error || !data) {
      return slug === fallbackListing.slug ? fallbackListing : null;
    }

    return mapPublicListing(data as PublicListingRow);
  } catch {
    return slug === fallbackListing.slug ? fallbackListing : null;
  }
}

export async function requirePublicBookingListing(slug: string) {
  const listing = await getPublicBookingListing(slug);

  if (!listing) {
    notFound();
  }

  return listing;
}
