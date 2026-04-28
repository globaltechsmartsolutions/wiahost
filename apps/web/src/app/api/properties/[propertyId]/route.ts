import { NextResponse } from "next/server";
import { propertySchema } from "@wiahost/shared";
import { z } from "zod";

import { apiError, validationError } from "@/lib/api/responses";
import { getPropertyById } from "@/lib/data/properties";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const idSchema = z.guid();

type PropertyRouteContext = {
  params: Promise<{ propertyId: string }>;
};

function updatePayload(parsed: z.infer<typeof propertySchema>) {
  return {
    address_line: parsed.addressLine,
    base_price: parsed.basePrice,
    bathrooms: parsed.bathrooms,
    bedrooms: parsed.bedrooms,
    city: parsed.city,
    cleaning_fee: parsed.cleaningFee,
    country: parsed.country,
    description: parsed.description,
    internal_name: parsed.internalName,
    max_guests: parsed.maxGuests,
    name: parsed.name,
    province: parsed.province,
    status: parsed.status,
  };
}

async function requirePropertyContext(propertyId: string) {
  if (!isSupabaseConfigured()) {
    return { error: apiError("supabase_not_configured", "Supabase no esta configurado.", 503) };
  }

  const validId = idSchema.safeParse(propertyId);

  if (!validId.success) {
    return { error: apiError("invalid_property_id", "Propiedad no valida.", 400) };
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return { error: apiError("unauthorized", "Debes iniciar sesion.", 401) };
  }

  return { propertyId: validId.data, supabase };
}

export async function GET(_request: Request, context: PropertyRouteContext) {
  const { propertyId } = await context.params;
  const property = await getPropertyById(propertyId);

  if (!property) {
    return apiError("property_not_found", "Propiedad no encontrada.", 404);
  }

  return NextResponse.json({ data: property });
}

export async function PATCH(request: Request, context: PropertyRouteContext) {
  const { propertyId } = await context.params;
  const ctx = await requirePropertyContext(propertyId);

  if ("error" in ctx) {
    return ctx.error;
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

  const { data, error } = await ctx.supabase
    .from("properties")
    .update(updatePayload(parsed.data))
    .eq("id", ctx.propertyId)
    .select("id,name,internal_name,city,status,bedrooms,max_guests,base_price")
    .single();

  if (error) {
    return apiError("property_update_failed", "No se ha podido actualizar la propiedad.", 400);
  }

  return NextResponse.json({ data });
}

export async function DELETE(_request: Request, context: PropertyRouteContext) {
  const { propertyId } = await context.params;
  const ctx = await requirePropertyContext(propertyId);

  if ("error" in ctx) {
    return ctx.error;
  }

  const { data, error } = await ctx.supabase
    .from("properties")
    .update({ status: "archived" })
    .eq("id", ctx.propertyId)
    .select("id,status")
    .single();

  if (error) {
    return apiError("property_archive_failed", "No se ha podido archivar la propiedad.", 400);
  }

  return NextResponse.json({ data });
}
