import { NextResponse } from "next/server";
import { propertySchema } from "@wiahost/shared";

import { apiError, validationError } from "@/lib/api/responses";
import { getProperties } from "@/lib/data/properties";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const properties = await getProperties();
  return NextResponse.json({ data: properties });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return apiError("supabase_not_configured", "Supabase no esta configurado para guardar propiedades.", 503);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError("invalid_json", "El cuerpo de la peticion no es JSON valido.", 400);
  }

  const parsed = propertySchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return apiError("unauthorized", "Debes iniciar sesion.", 401);
  }

  const { data, error } = await supabase
    .from("properties")
    .insert({
      created_by: userData.user.id,
      name: parsed.data.name,
      internal_name: parsed.data.internalName,
      description: parsed.data.description,
      address_line: parsed.data.addressLine,
      city: parsed.data.city,
      province: parsed.data.province,
      country: parsed.data.country,
      bedrooms: parsed.data.bedrooms,
      bathrooms: parsed.data.bathrooms,
      max_guests: parsed.data.maxGuests,
      base_price: parsed.data.basePrice,
      cleaning_fee: parsed.data.cleaningFee,
      status: parsed.data.status,
    })
    .select("id,name,internal_name,city,status,bedrooms,max_guests,base_price")
    .single();

  if (error) {
    return apiError("property_create_failed", "No se ha podido crear la propiedad.", 400);
  }

  return NextResponse.json({ data }, { status: 201 });
}
