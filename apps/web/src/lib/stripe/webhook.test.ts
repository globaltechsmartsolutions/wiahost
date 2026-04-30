import { describe, expect, it } from "vitest";
import type Stripe from "stripe";

import {
  decideStripeCheckoutWebhook,
  getStripeCheckoutPaymentId,
  isStripeCheckoutPaymentEvent,
} from "./webhook";

function checkoutSession(
  overrides: Partial<Stripe.Checkout.Session> = {},
): Stripe.Checkout.Session {
  return {
    client_reference_id: "payment-from-client-ref",
    id: "cs_test_123",
    metadata: { paymentId: "payment-from-metadata" },
    object: "checkout.session",
    payment_status: "paid",
    ...overrides,
  } as Stripe.Checkout.Session;
}

function checkoutEvent(
  type: string,
  session: Stripe.Checkout.Session = checkoutSession(),
) {
  return {
    data: { object: session },
    type,
  } as Pick<Stripe.Event, "type"> & {
    data: { object: Stripe.Checkout.Session };
  };
}

describe("Stripe webhook decisions", () => {
  it("recognizes checkout payment events", () => {
    expect(isStripeCheckoutPaymentEvent("checkout.session.completed")).toBe(
      true,
    );
    expect(
      isStripeCheckoutPaymentEvent("checkout.session.async_payment_succeeded"),
    ).toBe(true);
    expect(isStripeCheckoutPaymentEvent("payment_intent.succeeded")).toBe(
      false,
    );
  });

  it("prefers metadata paymentId over client reference", () => {
    expect(getStripeCheckoutPaymentId(checkoutSession())).toBe(
      "payment-from-metadata",
    );
  });

  it("falls back to client_reference_id when metadata is empty", () => {
    expect(
      getStripeCheckoutPaymentId(
        checkoutSession({
          metadata: {},
        }),
      ),
    ).toBe("payment-from-client-ref");
  });

  it("confirms paid checkout sessions", () => {
    expect(
      decideStripeCheckoutWebhook(checkoutEvent("checkout.session.completed")),
    ).toEqual({
      action: "confirm_payment",
      paymentId: "payment-from-metadata",
      providerPaymentId: "cs_test_123",
    });
  });

  it("confirms async payment succeeded sessions", () => {
    expect(
      decideStripeCheckoutWebhook(
        checkoutEvent(
          "checkout.session.async_payment_succeeded",
          checkoutSession({ metadata: {} }),
        ),
      ),
    ).toEqual({
      action: "confirm_payment",
      paymentId: "payment-from-client-ref",
      providerPaymentId: "cs_test_123",
    });
  });

  it("requires a payment reference for supported checkout events", () => {
    expect(
      decideStripeCheckoutWebhook(
        checkoutEvent(
          "checkout.session.completed",
          checkoutSession({ client_reference_id: null, metadata: {} }),
        ),
      ),
    ).toEqual({ action: "missing_reference" });
  });

  it("ignores unpaid checkout sessions and unrelated events", () => {
    expect(
      decideStripeCheckoutWebhook(
        checkoutEvent(
          "checkout.session.completed",
          checkoutSession({ payment_status: "unpaid" }),
        ),
      ),
    ).toEqual({ action: "ignore" });

    expect(
      decideStripeCheckoutWebhook(checkoutEvent("payment_intent.succeeded")),
    ).toEqual({ action: "ignore" });
  });
});
