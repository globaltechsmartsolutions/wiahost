import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { apiError } from "@/lib/api/responses";
import {
  confirmStripeCheckoutPayment,
  PaymentMutationError,
} from "@/lib/services/payments";
import { getStripeClient, getStripeWebhookSecret } from "@/lib/stripe/server";
import { decideStripeCheckoutWebhook } from "@/lib/stripe/webhook";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return apiError(
      "stripe_signature_missing",
      "Falta la firma del webhook de Stripe.",
      400,
    );
  }

  const payload = await request.text();
  let event: Stripe.Event;

  try {
    event = getStripeClient().webhooks.constructEvent(
      payload,
      signature,
      getStripeWebhookSecret(),
    );
  } catch {
    return apiError(
      "stripe_signature_invalid",
      "La firma del webhook de Stripe no es valida.",
      400,
    );
  }

  const decision = decideStripeCheckoutWebhook(
    event as Pick<Stripe.Event, "type"> & {
      data: { object: Stripe.Checkout.Session };
    },
  );

  if (decision.action === "missing_reference") {
    return apiError(
      "stripe_payment_reference_missing",
      "La sesion de Stripe no incluye paymentId.",
      422,
    );
  }

  if (decision.action === "confirm_payment") {
    try {
      await confirmStripeCheckoutPayment(
        decision.paymentId,
        decision.providerPaymentId,
      );
    } catch (error) {
      if (error instanceof PaymentMutationError) {
        return apiError(error.code, error.message, 400);
      }

      return apiError(
        "stripe_checkout_confirm_failed",
        "No se ha podido confirmar el pago de Stripe.",
        400,
      );
    }
  }

  return NextResponse.json({ received: true });
}
