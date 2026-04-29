import type { PaymentInput } from "@wiahost/shared";
import { randomUUID } from "node:crypto";
import type { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe/server";

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

type PaymentMetadata = Record<string, unknown> & {
  checkout?: {
    confirmedAt?: string;
    createdAt?: string;
    mode?: string;
    provider?: string;
    status?: string;
    token?: string;
    url?: string;
  };
};

export class PaymentMutationError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function mutationError(code: string, message: string): never {
  throw new PaymentMutationError(code, message);
}

function toDatabaseDateTime(value: string | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function paymentMetadata(value: unknown): PaymentMetadata {
  return asRecord(value) as PaymentMetadata;
}

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3002").replace(
    /\/$/,
    "",
  );
}

function createCheckoutToken() {
  return `checkout-token-${randomUUID()}-${randomUUID()}`;
}

function cents(amount: number | string | null, currency: string) {
  const numericAmount = Number(amount ?? 0);
  const zeroDecimalCurrencies = new Set([
    "bif",
    "clp",
    "djf",
    "gnf",
    "jpy",
    "kmf",
    "krw",
    "mga",
    "pyg",
    "rwf",
    "ugx",
    "vnd",
    "vuv",
    "xaf",
    "xof",
    "xpf",
  ]);
  const multiplier = zeroDecimalCurrencies.has(currency.toLowerCase())
    ? 1
    : 100;

  return Math.max(0, Math.round(numericAmount * multiplier));
}

async function getReservationGuestId(
  supabase: SupabaseServerClient,
  reservationId: string,
) {
  const { data, error } = await supabase
    .from("reservations")
    .select("guest_id")
    .eq("id", reservationId)
    .single();

  if (error || !data?.guest_id) {
    mutationError(
      "reservation_not_found",
      "No se ha encontrado la reserva asociada al pago.",
    );
  }

  return data.guest_id as string;
}

async function createCheckoutSyncEvent(
  supabase: SupabaseServerClient,
  input: {
    action: string;
    amount: number;
    paymentId: string;
    propertyId: string | null;
    reservationId: string;
    status: "pending" | "synced";
  },
) {
  await supabase.from("channel_sync_events").insert({
    channel: "direct",
    direction: "outbound",
    payload: {
      action: input.action,
      amount: input.amount,
      paymentId: input.paymentId,
      reservationId: input.reservationId,
      source: "direct_checkout",
    },
    property_id: input.propertyId,
    status: input.status,
  });
}

export async function createPayment(
  supabase: SupabaseServerClient,
  input: PaymentInput,
) {
  const guestId = await getReservationGuestId(supabase, input.reservationId);
  const { data, error } = await supabase
    .from("payments")
    .insert({
      amount: input.amount,
      currency: input.currency,
      guest_id: guestId,
      paid_at: toDatabaseDateTime(input.paidAt),
      provider: input.provider,
      reservation_id: input.reservationId,
      status: input.status,
    })
    .select("id,status,amount")
    .single();

  if (error || !data) {
    mutationError("payment_create_failed", "No se ha podido crear el pago.");
  }

  return data;
}

export async function updatePayment(
  supabase: SupabaseServerClient,
  paymentId: string,
  input: PaymentInput,
) {
  const guestId = await getReservationGuestId(supabase, input.reservationId);
  const { data, error } = await supabase
    .from("payments")
    .update({
      amount: input.amount,
      currency: input.currency,
      guest_id: guestId,
      paid_at: toDatabaseDateTime(input.paidAt),
      provider: input.provider,
      reservation_id: input.reservationId,
      status: input.status,
    })
    .eq("id", paymentId)
    .select("id,status,amount")
    .single();

  if (error || !data) {
    mutationError(
      "payment_update_failed",
      "No se ha podido actualizar el pago.",
    );
  }

  return data;
}

export async function deletePayment(
  supabase: SupabaseServerClient,
  paymentId: string,
) {
  const { data, error } = await supabase
    .from("payments")
    .delete()
    .eq("id", paymentId)
    .select("id")
    .single();

  if (error || !data) {
    mutationError("payment_delete_failed", "No se ha podido eliminar el pago.");
  }

  return data;
}

export async function createPaymentCheckoutLink(
  supabase: SupabaseServerClient,
  paymentId: string,
) {
  const { data: payment, error } = await supabase
    .from("payments")
    .select(
      "id,reservation_id,status,amount,currency,provider_payment_id,metadata,reservations(property_id,guests(full_name,email),properties(name))",
    )
    .eq("id", paymentId)
    .single();

  if (error || !payment) {
    mutationError("payment_not_found", "No se ha encontrado el pago.");
  }

  const metadata = paymentMetadata(payment.metadata);
  const existingCheckout = metadata.checkout ?? {};
  const token = existingCheckout.token ?? createCheckoutToken();
  const demoCheckoutUrl = `${appUrl()}/checkout/${payment.id}?token=${encodeURIComponent(token)}`;
  const checkoutStatus = payment.status === "paid" ? "paid" : "created";
  const reservation = Array.isArray(payment.reservations)
    ? payment.reservations[0]
    : payment.reservations;
  const property = Array.isArray(reservation?.properties)
    ? reservation?.properties[0]
    : reservation?.properties;
  const guest = Array.isArray(reservation?.guests)
    ? reservation?.guests[0]
    : reservation?.guests;
  let checkoutUrl = demoCheckoutUrl;
  let provider = "direct_checkout";
  let providerPaymentId =
    payment.provider_payment_id ?? `demo_checkout_${payment.id.slice(0, 8)}`;
  let checkoutMode = "demo_checkout";
  let checkoutProvider = "stripe_ready";

  if (isStripeConfigured() && Number(payment.amount ?? 0) > 0) {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      cancel_url: demoCheckoutUrl,
      client_reference_id: payment.id,
      customer_email:
        typeof guest?.email === "string" && guest.email.includes("@")
          ? guest.email
          : undefined,
      line_items: [
        {
          price_data: {
            currency: payment.currency.toLowerCase(),
            product_data: {
              description: `Reserva ${payment.reservation_id}`,
              name: property?.name
                ? `Reserva en ${property.name}`
                : "Reserva WIAHost",
            },
            unit_amount: cents(payment.amount, payment.currency),
          },
          quantity: 1,
        },
      ],
      metadata: {
        paymentId: payment.id,
        reservationId: payment.reservation_id,
      },
      mode: "payment",
      payment_intent_data: {
        metadata: {
          paymentId: payment.id,
          reservationId: payment.reservation_id,
        },
      },
      success_url: `${appUrl()}/checkout/${payment.id}?token=${encodeURIComponent(token)}&paid=1&provider=stripe`,
    });

    if (!session.url) {
      mutationError(
        "stripe_checkout_session_failed",
        "Stripe no ha devuelto una URL de checkout.",
      );
    }

    checkoutUrl = session.url;
    provider = "stripe";
    providerPaymentId = session.id;
    checkoutMode = "stripe_checkout";
    checkoutProvider = "stripe";
  }

  const { data, error: updateError } = await supabase
    .from("payments")
    .update({
      metadata: {
        ...metadata,
        checkout: {
          ...existingCheckout,
          createdAt: existingCheckout.createdAt ?? new Date().toISOString(),
          demoUrl: demoCheckoutUrl,
          mode: checkoutMode,
          provider: checkoutProvider,
          status: checkoutStatus,
          token,
          url: checkoutUrl,
        },
      },
      provider,
      provider_payment_id: providerPaymentId,
    })
    .eq("id", payment.id)
    .select("id,status,provider_payment_id")
    .single();

  if (updateError || !data) {
    mutationError(
      "payment_checkout_link_failed",
      "No se ha podido generar el enlace de cobro.",
    );
  }

  await createCheckoutSyncEvent(supabase, {
    action:
      checkoutProvider === "stripe"
        ? "stripe_checkout_session_created"
        : "direct_checkout_link_created",
    amount: Number(payment.amount ?? 0),
    paymentId: payment.id,
    propertyId: reservation?.property_id ?? null,
    reservationId: payment.reservation_id,
    status: "pending",
  });

  return {
    checkoutUrl,
    paymentId: data.id,
    provider,
    providerPaymentId: data.provider_payment_id,
    status: data.status,
  };
}

export async function confirmDemoCheckoutPayment(
  paymentId: string,
  token: string,
) {
  const supabase = getSupabaseAdminClient();
  const { data: payment, error } = await supabase
    .from("payments")
    .select(
      "id,reservation_id,status,amount,metadata,reservations(property_id,status)",
    )
    .eq("id", paymentId)
    .single();

  if (error || !payment) {
    mutationError("payment_not_found", "No se ha encontrado el pago.");
  }

  const metadata = paymentMetadata(payment.metadata);
  const checkout = metadata.checkout ?? {};

  if (checkout.token !== token) {
    mutationError(
      "checkout_token_invalid",
      "El enlace de cobro no es valido o ha caducado.",
    );
  }

  const paidAt = new Date().toISOString();
  const { data, error: updateError } = await supabase
    .from("payments")
    .update({
      metadata: {
        ...metadata,
        checkout: {
          ...checkout,
          confirmedAt: checkout.confirmedAt ?? paidAt,
          status: "paid",
        },
      },
      paid_at: paidAt,
      status: "paid",
    })
    .eq("id", payment.id)
    .select("id,status")
    .single();

  if (updateError || !data) {
    mutationError(
      "checkout_confirm_failed",
      "No se ha podido confirmar el pago.",
    );
  }

  await supabase
    .from("reservations")
    .update({ status: "confirmed" })
    .eq("id", payment.reservation_id)
    .in("status", ["inquiry", "pending"]);

  const reservation = Array.isArray(payment.reservations)
    ? payment.reservations[0]
    : payment.reservations;

  await createCheckoutSyncEvent(supabase as SupabaseServerClient, {
    action: "direct_checkout_paid",
    amount: Number(payment.amount ?? 0),
    paymentId: payment.id,
    propertyId: reservation?.property_id ?? null,
    reservationId: payment.reservation_id,
    status: "synced",
  });

  return data;
}

export async function confirmStripeCheckoutPayment(
  paymentId: string,
  providerPaymentId: string,
) {
  const supabase = getSupabaseAdminClient();
  const { data: payment, error } = await supabase
    .from("payments")
    .select(
      "id,reservation_id,status,amount,metadata,reservations(property_id,status)",
    )
    .eq("id", paymentId)
    .single();

  if (error || !payment) {
    mutationError("payment_not_found", "No se ha encontrado el pago.");
  }

  const metadata = paymentMetadata(payment.metadata);
  const checkout = metadata.checkout ?? {};
  const paidAt = new Date().toISOString();
  const { data, error: updateError } = await supabase
    .from("payments")
    .update({
      metadata: {
        ...metadata,
        checkout: {
          ...checkout,
          confirmedAt: checkout.confirmedAt ?? paidAt,
          provider: "stripe",
          providerPaymentId,
          status: "paid",
        },
      },
      paid_at: paidAt,
      provider: "stripe",
      provider_payment_id: providerPaymentId,
      status: "paid",
    })
    .eq("id", payment.id)
    .select("id,status")
    .single();

  if (updateError || !data) {
    mutationError(
      "stripe_checkout_confirm_failed",
      "No se ha podido confirmar el pago de Stripe.",
    );
  }

  await supabase
    .from("reservations")
    .update({ status: "confirmed" })
    .eq("id", payment.reservation_id)
    .in("status", ["inquiry", "pending"]);

  const reservation = Array.isArray(payment.reservations)
    ? payment.reservations[0]
    : payment.reservations;

  await createCheckoutSyncEvent(supabase as SupabaseServerClient, {
    action: "stripe_checkout_paid",
    amount: Number(payment.amount ?? 0),
    paymentId: payment.id,
    propertyId: reservation?.property_id ?? null,
    reservationId: payment.reservation_id,
    status: "synced",
  });

  return data;
}
