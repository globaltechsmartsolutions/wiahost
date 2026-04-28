import type { PaymentInput } from "@wiahost/shared";
import type { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

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
