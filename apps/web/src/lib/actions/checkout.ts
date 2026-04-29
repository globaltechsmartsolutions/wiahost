"use server";

import { redirect } from "next/navigation";
import { checkoutConfirmationSchema } from "@wiahost/shared";
import { z } from "zod";

import {
  confirmDemoCheckoutPayment,
  PaymentMutationError,
} from "@/lib/services/payments";

const idSchema = z.guid();

export async function confirmCheckoutAction(formData: FormData) {
  const paymentId = idSchema.safeParse(String(formData.get("paymentId") ?? ""));
  const parsed = checkoutConfirmationSchema.safeParse({
    token: formData.get("token"),
  });

  if (!paymentId.success || !parsed.success) {
    redirect("/checkout/error?reason=invalid");
  }

  try {
    await confirmDemoCheckoutPayment(paymentId.data, parsed.data.token);
  } catch (error) {
    const message =
      error instanceof PaymentMutationError
        ? error.message
        : "No se ha podido confirmar el pago.";

    redirect(
      `/checkout/${paymentId.data}?token=${encodeURIComponent(parsed.data.token)}&error=${encodeURIComponent(message)}`,
    );
  }

  redirect(
    `/checkout/${paymentId.data}?token=${encodeURIComponent(parsed.data.token)}&paid=1`,
  );
}
