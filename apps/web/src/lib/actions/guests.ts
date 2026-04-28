"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { guestSchema } from "@wiahost/shared";
import { z } from "zod";

import {
  createGuest,
  GuestMutationError,
  updateGuest,
} from "@/lib/services/guests";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const idSchema = z.guid();

function redirectWithError(message: string): never {
  redirect(`/guests?error=${encodeURIComponent(message)}`);
}

function redirectEditWithError(guestId: string, message: string): never {
  redirect(`/guests/${guestId}/edit?error=${encodeURIComponent(message)}`);
}

export async function createGuestAction(formData: FormData) {
  const parsed = guestSchema.safeParse({
    email: formData.get("email"),
    fullName: formData.get("fullName"),
    notes: formData.get("notes"),
    phone: formData.get("phone"),
    preferredLanguage: formData.get("preferredLanguage"),
  });

  if (!parsed.success) {
    redirectWithError(parsed.error.issues[0]?.message ?? "Huesped no valido.");
  }

  if (!isSupabaseConfigured()) {
    redirectWithError("Supabase no esta configurado.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect(
      `/login?error=${encodeURIComponent("Inicia sesion para crear huespedes.")}`,
    );
  }

  try {
    await createGuest(supabase, parsed.data);
  } catch (error) {
    if (error instanceof GuestMutationError) {
      redirectWithError(error.message);
    }

    redirectWithError("No se ha podido crear el huesped.");
  }

  revalidatePath("/guests");
  redirect("/guests?created=1");
}

export async function updateGuestAction(formData: FormData) {
  const guestId = String(formData.get("guestId") ?? "");
  const validGuestId = idSchema.safeParse(guestId);

  if (!validGuestId.success) {
    redirectWithError("El identificador de huesped no es valido.");
  }

  const parsed = guestSchema.safeParse({
    email: formData.get("email"),
    fullName: formData.get("fullName"),
    notes: formData.get("notes"),
    phone: formData.get("phone"),
    preferredLanguage: formData.get("preferredLanguage"),
  });

  if (!parsed.success) {
    redirectEditWithError(
      validGuestId.data,
      parsed.error.issues[0]?.message ?? "Huesped no valido.",
    );
  }

  if (!isSupabaseConfigured()) {
    redirectEditWithError(validGuestId.data, "Supabase no esta configurado.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect(
      `/login?error=${encodeURIComponent("Inicia sesion para editar huespedes.")}`,
    );
  }

  try {
    await updateGuest(supabase, validGuestId.data, parsed.data);
  } catch (error) {
    if (error instanceof GuestMutationError) {
      redirectEditWithError(validGuestId.data, error.message);
    }

    redirectEditWithError(
      validGuestId.data,
      "No se ha podido actualizar el huesped.",
    );
  }

  revalidatePath("/guests");
  revalidatePath(`/guests/${validGuestId.data}`);
  redirect(`/guests/${validGuestId.data}?updated=1`);
}
