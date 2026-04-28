"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { calendarBlockSchema } from "@wiahost/shared";
import { z } from "zod";

import {
  CalendarMutationError,
  createCalendarBlock,
  deleteCalendarBlock,
  updateCalendarBlock,
} from "@/lib/services/calendar";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const idSchema = z.guid();

function redirectWithError(message: string): never {
  redirect(`/calendar?error=${encodeURIComponent(message)}`);
}

async function requireCalendarMutationClient() {
  if (!isSupabaseConfigured()) {
    redirectWithError("Supabase no esta configurado.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect(
      `/login?error=${encodeURIComponent("Inicia sesion para gestionar el calendario.")}`,
    );
  }

  return supabase;
}

export async function createCalendarBlockAction(formData: FormData) {
  const parsed = calendarBlockSchema.safeParse({
    endDate: formData.get("endDate"),
    propertyId: formData.get("propertyId"),
    reason: formData.get("reason"),
    source: "manual",
    startDate: formData.get("startDate"),
  });

  if (!parsed.success) {
    redirectWithError(parsed.error.issues[0]?.message ?? "Bloqueo no valido.");
  }

  const supabase = await requireCalendarMutationClient();

  try {
    await createCalendarBlock(supabase, parsed.data);
  } catch (error) {
    if (error instanceof CalendarMutationError) {
      redirectWithError(error.message);
    }

    redirectWithError("No se ha podido crear el bloqueo.");
  }

  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  redirect("/calendar?created=1");
}

export async function updateCalendarBlockAction(formData: FormData) {
  const blockId = String(formData.get("blockId") ?? "");
  const validBlockId = idSchema.safeParse(blockId);

  if (!validBlockId.success) {
    redirectWithError("El identificador del bloqueo no es valido.");
  }

  const parsed = calendarBlockSchema.safeParse({
    endDate: formData.get("endDate"),
    propertyId: formData.get("propertyId"),
    reason: formData.get("reason"),
    source: formData.get("source") ?? "manual",
    startDate: formData.get("startDate"),
  });

  if (!parsed.success) {
    redirectWithError(parsed.error.issues[0]?.message ?? "Bloqueo no valido.");
  }

  const supabase = await requireCalendarMutationClient();

  try {
    await updateCalendarBlock(supabase, validBlockId.data, parsed.data);
  } catch (error) {
    if (error instanceof CalendarMutationError) {
      redirectWithError(error.message);
    }

    redirectWithError("No se ha podido actualizar el bloqueo.");
  }

  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  redirect("/calendar?updated=1");
}

export async function deleteCalendarBlockAction(formData: FormData) {
  const blockId = String(formData.get("blockId") ?? "");
  const validBlockId = idSchema.safeParse(blockId);

  if (!validBlockId.success) {
    redirectWithError("El identificador del bloqueo no es valido.");
  }

  const supabase = await requireCalendarMutationClient();

  try {
    await deleteCalendarBlock(supabase, validBlockId.data);
  } catch (error) {
    if (error instanceof CalendarMutationError) {
      redirectWithError(error.message);
    }

    redirectWithError("No se ha podido eliminar el bloqueo.");
  }

  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  redirect("/calendar?deleted=1");
}
