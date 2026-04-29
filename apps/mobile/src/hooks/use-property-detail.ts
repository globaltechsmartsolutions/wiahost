import { type PropertyInput, type PropertyStatus } from "@wiahost/shared";
import { useQuery } from "@tanstack/react-query";

import { demoProperties } from "@/src/lib/demo-data";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";

export type MobilePropertyDetail = PropertyInput & {
  id: string;
  statusLabel: string;
};

const statusLabels: Record<PropertyStatus, string> = {
  active: "Activo",
  archived: "Archivado",
  draft: "Borrador",
  paused: "Pausado",
};

function normalizeStatus(value: string | null | undefined): PropertyStatus {
  if (
    value === "active" ||
    value === "archived" ||
    value === "draft" ||
    value === "paused"
  ) {
    return value;
  }

  return "draft";
}

function fallbackProperty(propertyId: string): MobilePropertyDetail | null {
  const property = demoProperties.find((item) => item.id === propertyId);

  if (!property) {
    return null;
  }

  const status = property.status === "Activo" ? "active" : "paused";

  return {
    addressLine: "Direccion demo pendiente",
    basePrice: property.basePrice,
    bathrooms: 1,
    bedrooms: 1,
    city: property.city,
    cleaningFee: 35,
    country: "Espana",
    description: "",
    id: property.id,
    internalName: property.internalName,
    maxGuests: 2,
    name: property.name,
    province: property.city,
    status,
    statusLabel: statusLabels[status],
  };
}

async function loadPropertyDetail(
  propertyId: string,
): Promise<MobilePropertyDetail | null> {
  if (!isSupabaseConfigured()) {
    return fallbackProperty(propertyId);
  }

  try {
    const { data, error } = await supabase
      .from("properties")
      .select(
        "id,name,internal_name,description,address_line,city,province,country,bedrooms,bathrooms,max_guests,base_price,cleaning_fee,status",
      )
      .eq("id", propertyId)
      .single();

    if (error || !data) {
      return fallbackProperty(propertyId);
    }

    const status = normalizeStatus(data.status);

    return {
      addressLine: data.address_line,
      basePrice: Number(data.base_price ?? 0),
      bathrooms: Number(data.bathrooms ?? 0),
      bedrooms: Number(data.bedrooms ?? 0),
      city: data.city,
      cleaningFee: Number(data.cleaning_fee ?? 0),
      country: data.country,
      description: data.description ?? "",
      id: data.id,
      internalName: data.internal_name ?? "",
      maxGuests: Number(data.max_guests ?? 1),
      name: data.name,
      province: data.province ?? "",
      status,
      statusLabel: statusLabels[status],
    };
  } catch {
    return fallbackProperty(propertyId);
  }
}

export function usePropertyDetail(propertyId: string | undefined) {
  return useQuery({
    enabled: Boolean(propertyId),
    queryFn: () => loadPropertyDetail(propertyId ?? ""),
    queryKey: ["property-detail", propertyId],
  });
}
