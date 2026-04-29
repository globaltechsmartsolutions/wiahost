"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { channelSyncEventSchema, listingSchema } from "@wiahost/shared";
import { z } from "zod";

import {
  createListing,
  createSyncEvent,
  deleteListing,
  DistributionMutationError,
  updateListing,
} from "@/lib/services/distribution";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const idSchema = z.guid();

function redirectWithError(message: string): never {
  redirect(`/distribution?error=${encodeURIComponent(message)}`);
}

async function requireDistributionContext() {
  if (!isSupabaseConfigured()) {
    redirectWithError("Supabase no esta configurado.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect(
      `/login?error=${encodeURIComponent("Inicia sesion para gestionar distribucion.")}`,
    );
  }

  return { supabase };
}

function listingInputFromForm(formData: FormData) {
  return {
    channel: formData.get("channel"),
    channelUrl: formData.get("channelUrl"),
    externalListingId: formData.get("externalListingId"),
    propertyId: formData.get("propertyId"),
    publicSlug: formData.get("publicSlug"),
    status: formData.get("status"),
    syncEnabled: formData.get("syncEnabled") === "on",
    syncNotes: formData.get("syncNotes"),
    title: formData.get("title"),
  };
}

function syncEventInputFromForm(formData: FormData) {
  return {
    channel: formData.get("channel"),
    direction: formData.get("direction"),
    errorMessage: formData.get("errorMessage"),
    listingId: formData.get("listingId"),
    payload: formData.get("payload"),
    propertyId: formData.get("propertyId"),
    status: formData.get("status"),
  };
}

export async function createListingAction(formData: FormData) {
  const parsed = listingSchema.safeParse(listingInputFromForm(formData));

  if (!parsed.success) {
    redirectWithError(
      parsed.error.issues[0]?.message ?? "Publicacion no valida.",
    );
  }

  const { supabase } = await requireDistributionContext();

  try {
    await createListing(supabase, parsed.data);
  } catch (error) {
    if (error instanceof DistributionMutationError) {
      redirectWithError(error.message);
    }

    redirectWithError("No se ha podido crear la publicacion.");
  }

  revalidatePath("/distribution");
  redirect("/distribution?created=1");
}

export async function updateListingAction(formData: FormData) {
  const listingId = String(formData.get("listingId") ?? "");
  const validListingId = idSchema.safeParse(listingId);

  if (!validListingId.success) {
    redirectWithError("El identificador de publicacion no es valido.");
  }

  const parsed = listingSchema.safeParse(listingInputFromForm(formData));

  if (!parsed.success) {
    redirectWithError(
      parsed.error.issues[0]?.message ?? "Publicacion no valida.",
    );
  }

  const { supabase } = await requireDistributionContext();

  try {
    await updateListing(supabase, validListingId.data, parsed.data);
  } catch (error) {
    if (error instanceof DistributionMutationError) {
      redirectWithError(error.message);
    }

    redirectWithError("No se ha podido actualizar la publicacion.");
  }

  revalidatePath("/distribution");
  redirect("/distribution?updated=1");
}

export async function deleteListingAction(formData: FormData) {
  const listingId = String(formData.get("listingId") ?? "");
  const validListingId = idSchema.safeParse(listingId);

  if (!validListingId.success) {
    redirectWithError("El identificador de publicacion no es valido.");
  }

  const { supabase } = await requireDistributionContext();

  try {
    await deleteListing(supabase, validListingId.data);
  } catch (error) {
    if (error instanceof DistributionMutationError) {
      redirectWithError(error.message);
    }

    redirectWithError("No se ha podido eliminar la publicacion.");
  }

  revalidatePath("/distribution");
  redirect("/distribution?deleted=1");
}

export async function createSyncEventAction(formData: FormData) {
  const parsed = channelSyncEventSchema.safeParse(
    syncEventInputFromForm(formData),
  );

  if (!parsed.success) {
    redirectWithError(
      parsed.error.issues[0]?.message ?? "Evento de sync no valido.",
    );
  }

  const { supabase } = await requireDistributionContext();

  try {
    await createSyncEvent(supabase, parsed.data);
  } catch (error) {
    if (error instanceof DistributionMutationError) {
      redirectWithError(error.message);
    }

    redirectWithError("No se ha podido registrar el evento de sincronizacion.");
  }

  revalidatePath("/distribution");
  redirect("/distribution?synced=1");
}
