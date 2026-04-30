import type Stripe from "stripe";

const STRIPE_CHECKOUT_PAYMENT_EVENTS = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
]);

export type StripeWebhookDecision =
  | { action: "ignore" }
  | { action: "missing_reference" }
  | {
      action: "confirm_payment";
      paymentId: string;
      providerPaymentId: string;
    };

export function isStripeCheckoutPaymentEvent(eventType: string) {
  return STRIPE_CHECKOUT_PAYMENT_EVENTS.has(eventType);
}

export function getStripeCheckoutPaymentId(
  session: Pick<Stripe.Checkout.Session, "client_reference_id" | "metadata">,
) {
  return session.metadata?.paymentId ?? session.client_reference_id ?? null;
}

export function decideStripeCheckoutWebhook(
  event: Pick<Stripe.Event, "type"> & {
    data: { object: Stripe.Checkout.Session };
  },
): StripeWebhookDecision {
  if (!isStripeCheckoutPaymentEvent(event.type)) {
    return { action: "ignore" };
  }

  const session = event.data.object;
  const paymentId = getStripeCheckoutPaymentId(session);

  if (!paymentId) {
    return { action: "missing_reference" };
  }

  if (session.payment_status !== "paid") {
    return { action: "ignore" };
  }

  return {
    action: "confirm_payment",
    paymentId,
    providerPaymentId: session.id,
  };
}
