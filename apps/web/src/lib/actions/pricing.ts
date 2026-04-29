"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pricingObservationSchema } from "@wiahost/shared";
import { z } from "zod";

import {
  createPricingObservation,
  deletePricingObservation,
  PricingMutationError,
  syncPricingObservation,
  updatePricingObservation,
} from "@/lib/services/pricing";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const idSchema = z.guid();

function redirectWithError(message: string): never {
  redirect(`/pricing?error=${encodeURIComponent(message)}`);
}

async function requirePricingClient() {
  if (!isSupabaseConfigured()) {
    redirectWithError("Supabase no esta configurado.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect(
      `/login?error=${encodeURIComponent("Inicia sesion para gestionar precios.")}`,
    );
  }

  return supabase;
}

function pricingInputFromForm(formData: FormData) {
  return {
    approvedPrice: formData.get("approvedPrice"),
    bookingPace: formData.get("bookingPace"),
    conversionStatus: formData.get("conversionStatus"),
    currency: formData.get("currency"),
    currentPrice: formData.get("currentPrice"),
    finalPrice: formData.get("finalPrice"),
    leadTimeDays: formData.get("leadTimeDays"),
    observedFor: formData.get("observedFor"),
    occupancyRate: formData.get("occupancyRate"),
    propertyId: formData.get("propertyId"),
    reservationId: formData.get("reservationId"),
    source: formData.get("source"),
    suggestedPrice: formData.get("suggestedPrice"),
  };
}

export async function createPricingObservationAction(formData: FormData) {
  const parsed = pricingObservationSchema.safeParse(
    pricingInputFromForm(formData),
  );

  if (!parsed.success) {
    redirectWithError(
      parsed.error.issues[0]?.message ?? "Observacion de precio no valida.",
    );
  }

  const supabase = await requirePricingClient();

  try {
    await createPricingObservation(supabase, parsed.data);
  } catch (error) {
    if (error instanceof PricingMutationError) {
      redirectWithError(error.message);
    }

    redirectWithError("No se ha podido crear la observacion de precio.");
  }

  revalidatePath("/pricing");
  revalidatePath("/dashboard");
  redirect("/pricing?created=1");
}

export async function updatePricingObservationAction(formData: FormData) {
  const observationId = String(formData.get("observationId") ?? "");
  const validObservationId = idSchema.safeParse(observationId);

  if (!validObservationId.success) {
    redirectWithError("El identificador de precio no es valido.");
  }

  const parsed = pricingObservationSchema.safeParse(
    pricingInputFromForm(formData),
  );

  if (!parsed.success) {
    redirectWithError(
      parsed.error.issues[0]?.message ?? "Observacion de precio no valida.",
    );
  }

  const supabase = await requirePricingClient();

  try {
    await updatePricingObservation(
      supabase,
      validObservationId.data,
      parsed.data,
    );
  } catch (error) {
    if (error instanceof PricingMutationError) {
      redirectWithError(error.message);
    }

    redirectWithError("No se ha podido actualizar la observacion de precio.");
  }

  revalidatePath("/pricing");
  revalidatePath("/dashboard");
  redirect("/pricing?updated=1");
}

export async function deletePricingObservationAction(formData: FormData) {
  const observationId = String(formData.get("observationId") ?? "");
  const validObservationId = idSchema.safeParse(observationId);

  if (!validObservationId.success) {
    redirectWithError("El identificador de precio no es valido.");
  }

  const supabase = await requirePricingClient();

  try {
    await deletePricingObservation(supabase, validObservationId.data);
  } catch (error) {
    if (error instanceof PricingMutationError) {
      redirectWithError(error.message);
    }

    redirectWithError("No se ha podido eliminar la observacion de precio.");
  }

  revalidatePath("/pricing");
  revalidatePath("/dashboard");
  redirect("/pricing?deleted=1");
}

export async function syncPricingObservationAction(formData: FormData) {
  const observationId = String(formData.get("observationId") ?? "");
  const validObservationId = idSchema.safeParse(observationId);

  if (!validObservationId.success) {
    redirectWithError("El identificador de precio no es valido.");
  }

  const supabase = await requirePricingClient();

  try {
    await syncPricingObservation(supabase, validObservationId.data);
  } catch (error) {
    if (error instanceof PricingMutationError) {
      redirectWithError(error.message);
    }

    redirectWithError("No se ha podido registrar la sincronizacion de precio.");
  }

  revalidatePath("/pricing");
  revalidatePath("/distribution");
  revalidatePath("/dashboard");
  redirect("/pricing?synced=1");
}
