import type { PaymentInput } from "@wiahost/shared";
import { randomUUID } from "node:crypto";
import type { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

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
      "id,reservation_id,status,amount,currency,provider_payment_id,metadata,reservations(property_id)",
    )
    .eq("id", paymentId)
    .single();

  if (error || !payment) {
    mutationError("payment_not_found", "No se ha encontrado el pago.");
  }

  const metadata = paymentMetadata(payment.metadata);
  const existingCheckout = metadata.checkout ?? {};
  const token = existingCheckout.token ?? createCheckoutToken();
  const checkoutUrl = `${appUrl()}/checkout/${payment.id}?token=${encodeURIComponent(token)}`;
  const providerPaymentId =
    payment.provider_payment_id ?? `demo_checkout_${payment.id.slice(0, 8)}`;
  const checkoutStatus = payment.status === "paid" ? "paid" : "created";

  const { data, error: updateError } = await supabase
    .from("payments")
    .update({
      metadata: {
        ...metadata,
        checkout: {
          ...existingCheckout,
          createdAt: existingCheckout.createdAt ?? new Date().toISOString(),
          mode: "demo_checkout",
          provider: "stripe_ready",
          status: checkoutStatus,
          token,
          url: checkoutUrl,
        },
      },
      provider: "direct_checkout",
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

  const reservation = Array.isArray(payment.reservations)
    ? payment.reservations[0]
    : payment.reservations;

  await createCheckoutSyncEvent(supabase, {
    action: "direct_checkout_link_created",
    amount: Number(payment.amount ?? 0),
    paymentId: payment.id,
    propertyId: reservation?.property_id ?? null,
    reservationId: payment.reservation_id,
    status: "pending",
  });

  return {
    checkoutUrl,
    paymentId: data.id,
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
