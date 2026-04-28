"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { propertySchema } from "@wiahost/shared";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function optionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function requiredString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createPropertyAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/properties/new?error=Supabase%20no%20esta%20configurado.%20Levanta%20Supabase%20local%20para%20guardar.");
  }

  const parsed = propertySchema.safeParse({
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
  });

  if (!parsed.success) {
    redirect(`/properties/new?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Datos invalidos.")}`);
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login?error=Inicia%20sesion%20para%20crear%20propiedades.");
  }

  const { error } = await supabase.from("properties").insert({
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
  });

  if (error) {
    redirect(`/properties/new?error=${encodeURIComponent("No se ha podido guardar la propiedad. Revisa permisos/RLS.")}`);
  }

  revalidatePath("/properties");
  revalidatePath("/dashboard");
  redirect("/properties?created=1");
}
