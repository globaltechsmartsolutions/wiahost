"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  OperationMutationError,
  prepareDirectLeadPayment,
  updateDirectLeadStatus,
} from "@/lib/services/operations";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const idSchema = z.guid();
const leadStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "cancelled"]),
});

function redirectWithError(message: string): never {
  redirect(`/leads?error=${encodeURIComponent(message)}`);
}

async function requireLeadContext() {
  if (!isSupabaseConfigured()) {
    redirectWithError("Supabase no esta configurado.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect(
      `/login?error=${encodeURIComponent("Inicia sesion para gestionar leads.")}`,
    );
  }

  return { supabase, userId: userData.user.id };
}

export async function updateLeadStatusAction(formData: FormData) {
  const reservationId = idSchema.safeParse(
    String(formData.get("reservationId") ?? ""),
  );
  const parsed = leadStatusSchema.safeParse({
    status: formData.get("status"),
  });

  if (!reservationId.success || !parsed.success) {
    redirectWithError("Estado de lead no valido.");
  }

  const { supabase, userId } = await requireLeadContext();

  try {
    await updateDirectLeadStatus(
      supabase,
      reservationId.data,
      parsed.data.status,
      userId,
    );
  } catch (error) {
    if (error instanceof OperationMutationError) {
      redirectWithError(error.message);
    }

    redirectWithError("No se ha podido actualizar el lead.");
  }

  revalidatePath("/leads");
  revalidatePath("/reservations");
  revalidatePath("/dashboard");
  redirect("/leads?updated=1");
}

export async function prepareLeadPaymentAction(formData: FormData) {
  const reservationId = idSchema.safeParse(
    String(formData.get("reservationId") ?? ""),
  );

  if (!reservationId.success) {
    redirectWithError("Lead no valido para preparar pago.");
  }

  const { supabase, userId } = await requireLeadContext();

  try {
    await prepareDirectLeadPayment(supabase, reservationId.data, userId);
  } catch (error) {
    if (error instanceof OperationMutationError) {
      redirectWithError(error.message);
    }

    redirectWithError("No se ha podido preparar el pago.");
  }

  revalidatePath("/leads");
  revalidatePath("/payments");
  revalidatePath("/reservations");
  revalidatePath("/dashboard");
  redirect("/leads?payment=1");
}
