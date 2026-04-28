"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { guestSchema } from "@wiahost/shared";

import { createGuest, GuestMutationError } from "@/lib/services/guests";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function redirectWithError(message: string): never {
  redirect(`/guests?error=${encodeURIComponent(message)}`);
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
