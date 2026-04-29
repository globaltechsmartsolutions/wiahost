"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { paymentSchema } from "@wiahost/shared";
import { z } from "zod";

import {
  createPayment,
  createPaymentCheckoutLink,
  deletePayment,
  PaymentMutationError,
  updatePayment,
} from "@/lib/services/payments";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const idSchema = z.guid();

function redirectWithError(message: string): never {
  redirect(`/payments?error=${encodeURIComponent(message)}`);
}

async function requirePaymentClient() {
  if (!isSupabaseConfigured()) {
    redirectWithError("Supabase no esta configurado.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect(
      `/login?error=${encodeURIComponent("Inicia sesion para gestionar pagos.")}`,
    );
  }

  return supabase;
}

function paymentInputFromForm(formData: FormData) {
  return {
    amount: formData.get("amount"),
    currency: formData.get("currency"),
    paidAt: formData.get("paidAt"),
    provider: formData.get("provider"),
    reservationId: formData.get("reservationId"),
    status: formData.get("status"),
  };
}

export async function createPaymentAction(formData: FormData) {
  const parsed = paymentSchema.safeParse(paymentInputFromForm(formData));

  if (!parsed.success) {
    redirectWithError(parsed.error.issues[0]?.message ?? "Pago no valido.");
  }

  const supabase = await requirePaymentClient();

  try {
    await createPayment(supabase, parsed.data);
  } catch (error) {
    if (error instanceof PaymentMutationError) {
      redirectWithError(error.message);
    }

    redirectWithError("No se ha podido crear el pago.");
  }

  revalidatePath("/payments");
  revalidatePath("/owners");
  redirect("/payments?created=1");
}

export async function updatePaymentAction(formData: FormData) {
  const paymentId = String(formData.get("paymentId") ?? "");
  const validPaymentId = idSchema.safeParse(paymentId);

  if (!validPaymentId.success) {
    redirectWithError("El identificador de pago no es valido.");
  }

  const parsed = paymentSchema.safeParse(paymentInputFromForm(formData));

  if (!parsed.success) {
    redirectWithError(parsed.error.issues[0]?.message ?? "Pago no valido.");
  }

  const supabase = await requirePaymentClient();

  try {
    await updatePayment(supabase, validPaymentId.data, parsed.data);
  } catch (error) {
    if (error instanceof PaymentMutationError) {
      redirectWithError(error.message);
    }

    redirectWithError("No se ha podido actualizar el pago.");
  }

  revalidatePath("/payments");
  revalidatePath("/owners");
  redirect("/payments?updated=1");
}

export async function deletePaymentAction(formData: FormData) {
  const paymentId = String(formData.get("paymentId") ?? "");
  const validPaymentId = idSchema.safeParse(paymentId);

  if (!validPaymentId.success) {
    redirectWithError("El identificador de pago no es valido.");
  }

  const supabase = await requirePaymentClient();

  try {
    await deletePayment(supabase, validPaymentId.data);
  } catch (error) {
    if (error instanceof PaymentMutationError) {
      redirectWithError(error.message);
    }

    redirectWithError("No se ha podido eliminar el pago.");
  }

  revalidatePath("/payments");
  revalidatePath("/owners");
  redirect("/payments?deleted=1");
}

export async function createPaymentCheckoutLinkAction(formData: FormData) {
  const paymentId = String(formData.get("paymentId") ?? "");
  const validPaymentId = idSchema.safeParse(paymentId);

  if (!validPaymentId.success) {
    redirectWithError("El identificador de pago no es valido.");
  }

  const supabase = await requirePaymentClient();

  try {
    await createPaymentCheckoutLink(supabase, validPaymentId.data);
  } catch (error) {
    if (error instanceof PaymentMutationError) {
      redirectWithError(error.message);
    }

    redirectWithError("No se ha podido generar el enlace de cobro.");
  }

  revalidatePath("/payments");
  revalidatePath("/leads");
  redirect("/payments?checkout=1");
}
