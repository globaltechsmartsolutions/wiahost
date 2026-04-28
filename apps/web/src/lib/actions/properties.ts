"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { propertySchema } from "@wiahost/shared";
import { z } from "zod";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const idSchema = z.guid();

function optionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function requiredString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function propertyPayload(formData: FormData) {
  return {
    name: requiredString(formData, "name"),
    internalName: optionalString(formData, "internalName"),
    description: optionalString(formData, "description"),
    addressLine: requiredString(formData, "addressLine"),
    city: requiredString(formData, "city"),
    province: optionalString(formData, "province"),
    country: optionalString(formData, "country") ?? "Spain",
    bedrooms: formData.get("bedrooms"),
    bathrooms: formData.get("bathrooms"),
    maxGuests: formData.get("maxGuests"),
    basePrice: formData.get("basePrice"),
    cleaningFee: formData.get("cleaningFee"),
    status: requiredString(formData, "status") || "draft",
  };
}

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function propertyUpdatePayload(parsed: {
  addressLine: string;
  basePrice: number;
  bathrooms: number;
  bedrooms: number;
  city: string;
  cleaningFee: number;
  country: string;
  description?: string;
  internalName?: string;
  maxGuests: number;
  name: string;
  province?: string;
  status: "active" | "archived" | "draft" | "paused";
}) {
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

async function getMutationContext(path: string) {
  if (!isSupabaseConfigured()) {
    redirectWithError(path, "Supabase no esta configurado. Levanta Supabase local para guardar.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login?error=Inicia%20sesion%20para%20modificar%20propiedades.");
  }

  return { supabase, userId: userData.user.id };
}

export async function createPropertyAction(formData: FormData) {
  const path = "/properties/new";
  const parsed = propertySchema.safeParse(propertyPayload(formData));

  if (!parsed.success) {
    redirectWithError(path, parsed.error.issues[0]?.message ?? "Datos invalidos.");
  }

  const { supabase, userId } = await getMutationContext(path);
  const { error } = await supabase.from("properties").insert({
    ...propertyUpdatePayload(parsed.data),
    created_by: userId,
  });

  if (error) {
    redirectWithError(path, "No se ha podido guardar la propiedad. Revisa permisos/RLS.");
  }

  revalidatePath("/properties");
  revalidatePath("/dashboard");
  redirect("/properties?created=1");
}

export async function updatePropertyAction(formData: FormData) {
  const propertyId = idSchema.safeParse(requiredString(formData, "propertyId"));

  if (!propertyId.success) {
    redirectWithError("/properties", "Propiedad no valida.");
  }

  const path = `/properties/${propertyId.data}/edit`;
  const parsed = propertySchema.safeParse(propertyPayload(formData));

  if (!parsed.success) {
    redirectWithError(path, parsed.error.issues[0]?.message ?? "Datos invalidos.");
  }

  const { supabase } = await getMutationContext(path);
  const { error } = await supabase
    .from("properties")
    .update(propertyUpdatePayload(parsed.data))
    .eq("id", propertyId.data);

  if (error) {
    redirectWithError(path, "No se ha podido actualizar la propiedad.");
  }

  revalidatePath("/properties");
  revalidatePath(`/properties/${propertyId.data}`);
  revalidatePath("/dashboard");
  redirect(`/properties/${propertyId.data}?updated=1`);
}

export async function archivePropertyAction(formData: FormData) {
  const propertyId = idSchema.safeParse(requiredString(formData, "propertyId"));

  if (!propertyId.success) {
    redirectWithError("/properties", "Propiedad no valida.");
  }

  const path = `/properties/${propertyId.data}`;
  const { supabase } = await getMutationContext(path);
  const { error } = await supabase.from("properties").update({ status: "archived" }).eq("id", propertyId.data);

  if (error) {
    redirectWithError(path, "No se ha podido archivar la propiedad.");
  }

  revalidatePath("/properties");
  revalidatePath(path);
  revalidatePath("/dashboard");
  redirect(`${path}?archived=1`);
}

export async function activatePropertyAction(formData: FormData) {
  const propertyId = idSchema.safeParse(requiredString(formData, "propertyId"));

  if (!propertyId.success) {
    redirectWithError("/properties", "Propiedad no valida.");
  }

  const path = `/properties/${propertyId.data}`;
  const { supabase } = await getMutationContext(path);
  const { error } = await supabase.from("properties").update({ status: "active" }).eq("id", propertyId.data);

  if (error) {
    redirectWithError(path, "No se ha podido reactivar la propiedad.");
  }

  revalidatePath("/properties");
  revalidatePath(path);
  revalidatePath("/dashboard");
  redirect(`${path}?activated=1`);
}
