"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { partnerAppSchema, partnerAppUpdateSchema } from "@wiahost/shared";
import { z } from "zod";

import {
  createPartnerApp,
  deletePartnerApp,
  PartnerAppMutationError,
  updatePartnerApp,
} from "@/lib/services/partner-apps";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const idSchema = z.guid();

function redirectWithError(message: string): never {
  redirect(`/partner-apps?error=${encodeURIComponent(message)}`);
}

async function requirePartnerAppsContext() {
  if (!isSupabaseConfigured()) {
    redirectWithError("Supabase no esta configurado.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect(
      `/login?error=${encodeURIComponent("Inicia sesion para gestionar webs conectadas.")}`,
    );
  }

  return { supabase };
}

function partnerAppInputFromForm(formData: FormData) {
  return {
    allowedOrigins: formData.get("allowedOrigins"),
    apiKey: formData.get("apiKey"),
    displayName: formData.get("displayName"),
    notes: formData.get("notes"),
    partnerId: formData.get("partnerId"),
    rateLimitPerMinute: formData.get("rateLimitPerMinute"),
    redirectUrls: formData.get("redirectUrls"),
    scopes: formData.get("scopes"),
    status: formData.get("status"),
    webhookUrl: formData.get("webhookUrl"),
  };
}

export async function createPartnerAppAction(formData: FormData) {
  const parsed = partnerAppSchema.safeParse(partnerAppInputFromForm(formData));

  if (!parsed.success) {
    redirectWithError(
      parsed.error.issues[0]?.message ?? "Web conectada no valida.",
    );
  }

  const { supabase } = await requirePartnerAppsContext();

  try {
    await createPartnerApp(supabase, parsed.data);
  } catch (error) {
    if (error instanceof PartnerAppMutationError) {
      redirectWithError(error.message);
    }

    redirectWithError("No se ha podido crear la web conectada.");
  }

  revalidatePath("/partner-apps");
  revalidatePath("/wia-roadmap");
  redirect("/partner-apps?created=1");
}

export async function updatePartnerAppAction(formData: FormData) {
  const partnerAppId = String(formData.get("partnerAppId") ?? "");
  const validPartnerAppId = idSchema.safeParse(partnerAppId);

  if (!validPartnerAppId.success) {
    redirectWithError("El identificador de la web conectada no es valido.");
  }

  const parsed = partnerAppUpdateSchema.safeParse(
    partnerAppInputFromForm(formData),
  );

  if (!parsed.success) {
    redirectWithError(
      parsed.error.issues[0]?.message ?? "Web conectada no valida.",
    );
  }

  const { supabase } = await requirePartnerAppsContext();

  try {
    await updatePartnerApp(supabase, validPartnerAppId.data, parsed.data);
  } catch (error) {
    if (error instanceof PartnerAppMutationError) {
      redirectWithError(error.message);
    }

    redirectWithError("No se ha podido actualizar la web conectada.");
  }

  revalidatePath("/partner-apps");
  revalidatePath("/wia-roadmap");
  redirect("/partner-apps?updated=1");
}

export async function deletePartnerAppAction(formData: FormData) {
  const partnerAppId = String(formData.get("partnerAppId") ?? "");
  const validPartnerAppId = idSchema.safeParse(partnerAppId);

  if (!validPartnerAppId.success) {
    redirectWithError("El identificador de la web conectada no es valido.");
  }

  const { supabase } = await requirePartnerAppsContext();

  try {
    await deletePartnerApp(supabase, validPartnerAppId.data);
  } catch (error) {
    if (error instanceof PartnerAppMutationError) {
      redirectWithError(error.message);
    }

    redirectWithError("No se ha podido eliminar la web conectada.");
  }

  revalidatePath("/partner-apps");
  revalidatePath("/wia-roadmap");
  redirect("/partner-apps?deleted=1");
}
