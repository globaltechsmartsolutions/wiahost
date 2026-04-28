import { properties as demoProperties } from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PropertyListItem = {
  id: string;
  name: string;
  internalName: string;
  city: string;
  status: string;
  statusValue: string;
  channel: string;
  occupancy: string;
  revenue: string;
  nextCheckIn: string;
  bedrooms?: number;
  maxGuests?: number;
  basePrice?: number;
};

export type PropertyDetail = PropertyListItem & {
  addressLine: string;
  bathrooms: number;
  cleaningFee: number;
  country: string;
  description?: string;
  maxGuests: number;
  province?: string;
};

function getPropertyStatusLabel(status: string) {
  const labels: Record<string, string> = {
    active: "Activo",
    archived: "Archivado",
    draft: "Borrador",
    paused: "Pausado",
  };

  return labels[status] ?? status;
}

function getPropertyStatusValue(status: string) {
  const labels: Record<string, string> = {
    Activo: "active",
    Archivado: "archived",
    Borrador: "draft",
    Pausado: "paused",
  };

  return labels[status] ?? status;
}

function demoListProperties(): PropertyListItem[] {
  return demoProperties.map((property) => ({
    ...property,
    statusValue: getPropertyStatusValue(property.status),
  }));
}

function demoPropertyDetail(id: string): PropertyDetail | null {
  const property = demoListProperties().find((item) => item.id === id);

  if (!property) {
    return null;
  }

  return {
    ...property,
    addressLine: "Direccion demo pendiente",
    bathrooms: 1,
    bedrooms: 1,
    basePrice: 120,
    cleaningFee: 40,
    country: "Spain",
    description: "Propiedad demo lista para operaciones, canales y automatizaciones.",
    maxGuests: 2,
    province: property.city,
  };
}

export async function getProperties(): Promise<PropertyListItem[]> {
  if (!isSupabaseConfigured()) {
    return demoListProperties();
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("properties")
      .select("id,name,internal_name,city,status,bedrooms,max_guests,base_price")
      .order("created_at", { ascending: false });

    if (error || !data) {
      return demoListProperties();
    }

    return data.map((property) => ({
      id: property.id,
      name: property.name,
      internalName: property.internal_name ?? property.id.slice(0, 8),
      city: property.city,
      status: getPropertyStatusLabel(property.status),
      statusValue: property.status,
      channel: "Pendiente de canal",
      occupancy: "-",
      revenue: `${Number(property.base_price ?? 0).toLocaleString("es-ES")} € base`,
      nextCheckIn: "Sin llegada prevista",
      bedrooms: property.bedrooms,
      maxGuests: property.max_guests,
      basePrice: property.base_price,
    }));
  } catch {
    return demoListProperties();
  }
}

export async function getPropertyById(propertyId: string): Promise<PropertyDetail | null> {
  if (!isSupabaseConfigured()) {
    return demoPropertyDetail(propertyId);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("properties")
      .select(
        "id,name,internal_name,description,address_line,city,province,country,status,bedrooms,bathrooms,max_guests,base_price,cleaning_fee",
      )
      .eq("id", propertyId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      internalName: data.internal_name ?? data.id.slice(0, 8),
      addressLine: data.address_line,
      bathrooms: Number(data.bathrooms ?? 0),
      bedrooms: data.bedrooms,
      basePrice: Number(data.base_price ?? 0),
      channel: "Pendiente de canal",
      city: data.city,
      cleaningFee: Number(data.cleaning_fee ?? 0),
      country: data.country,
      description: data.description ?? undefined,
      maxGuests: data.max_guests,
      nextCheckIn: "Sin llegada prevista",
      occupancy: "-",
      province: data.province ?? undefined,
      revenue: `${Number(data.base_price ?? 0).toLocaleString("es-ES")} â‚¬ base`,
      status: getPropertyStatusLabel(data.status),
      statusValue: data.status,
    };
  } catch {
    return null;
  }
}
