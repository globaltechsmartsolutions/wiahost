import { properties as demoProperties } from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PropertyListItem = {
  id: string;
  name: string;
  internalName: string;
  city: string;
  status: string;
  channel: string;
  occupancy: string;
  revenue: string;
  nextCheckIn: string;
  bedrooms?: number;
  maxGuests?: number;
  basePrice?: number;
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

export async function getProperties(): Promise<PropertyListItem[]> {
  if (!isSupabaseConfigured()) {
    return demoProperties;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("properties")
      .select("id,name,internal_name,city,status,bedrooms,max_guests,base_price")
      .order("created_at", { ascending: false });

    if (error || !data) {
      return demoProperties;
    }

    return data.map((property) => ({
      id: property.id,
      name: property.name,
      internalName: property.internal_name ?? property.id.slice(0, 8),
      city: property.city,
      status: getPropertyStatusLabel(property.status),
      channel: "Pendiente de canal",
      occupancy: "-",
      revenue: `${Number(property.base_price ?? 0).toLocaleString("es-ES")} € base`,
      nextCheckIn: "Sin llegada prevista",
      bedrooms: property.bedrooms,
      maxGuests: property.max_guests,
      basePrice: property.base_price,
    }));
  } catch {
    return demoProperties;
  }
}
