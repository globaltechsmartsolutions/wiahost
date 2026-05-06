import type { DirectBookingInquiryInput } from "@wiahost/shared";

import { getPublicBookingListing } from "@/lib/data/direct-booking";
import {
  assertPropertyDateRangeAvailable,
  AvailabilityConflictError,
} from "@/lib/services/availability";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export class DirectBookingMutationError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function mutationError(code: string, message: string): never {
  throw new DirectBookingMutationError(code, message);
}

function mapAvailabilityConflict(error: unknown): never {
  if (error instanceof AvailabilityConflictError) {
    mutationError(error.code, error.message);
  }

  throw error;
}

function nightsBetween(checkIn: string, checkOut: string) {
  const milliseconds =
    new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(1, Math.round(milliseconds / 86_400_000));
}

export async function createDirectBookingInquiry(
  slug: string,
  input: DirectBookingInquiryInput,
) {
  const listing = await getPublicBookingListing(slug);

  if (!listing) {
    mutationError(
      "booking_listing_not_found",
      "No se ha encontrado el anuncio para reservar.",
    );
  }

  const supabase = getSupabaseAdminClient();

  try {
    await assertPropertyDateRangeAvailable(supabase, {
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      propertyId: listing.propertyId,
    });
  } catch (error) {
    mapAvailabilityConflict(error);
  }

  const nights = nightsBetween(input.checkIn, input.checkOut);
  const totalAmount = nights * listing.basePrice + listing.cleaningFee;
  const sentAt = new Date().toISOString();
  const message =
    input.message ??
    `Solicitud de reserva directa para ${listing.propertyName}.`;

  const { data: guest, error: guestError } = await supabase
    .from("guests")
    .insert({
      email: input.guestEmail,
      full_name: input.guestFullName,
      notes: "Creado desde motor de reserva directa.",
      phone: input.guestPhone ?? null,
      preferred_language: "es",
      tags: ["direct_booking"],
    })
    .select("id")
    .single();

  if (guestError || !guest) {
    mutationError(
      "direct_guest_create_failed",
      "No se ha podido guardar tus datos de contacto.",
    );
  }

  const { data: reservation, error: reservationError } = await supabase
    .from("reservations")
    .insert({
      channel: "direct",
      check_in: input.checkIn,
      check_out: input.checkOut,
      cleaning_fee: listing.cleaningFee,
      guest_id: guest.id,
      guests_count: input.guestsCount,
      nightly_rate: listing.basePrice,
      notes: message,
      payout_amount: totalAmount,
      property_id: listing.propertyId,
      security_deposit: 0,
      source_payload: {
        listingId: listing.id,
        publicSlug: slug,
        source: "public_booking_engine",
      },
      status: "inquiry",
      taxes_amount: 0,
      total_amount: totalAmount,
    })
    .select("id,total_amount,status")
    .single();

  if (reservationError || !reservation) {
    mutationError(
      "direct_reservation_create_failed",
      "No se ha podido crear la solicitud de reserva.",
    );
  }

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .insert({
      guest_id: guest.id,
      last_message_at: sentAt,
      property_id: listing.propertyId,
      reservation_id: reservation.id,
      status: "open",
    })
    .select("id")
    .single();

  if (!conversationError && conversation) {
    await supabase.from("conversation_messages").insert({
      body: message,
      channel: "inbox",
      conversation_id: conversation.id,
      direction: "inbound",
      metadata: {
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        guestsCount: input.guestsCount,
        source: "public_booking_engine",
      },
      sent_at: sentAt,
    });
  }

  await supabase.from("channel_sync_events").insert({
    channel: "direct",
    direction: "inbound",
    listing_id: listing.id,
    payload: {
      action: "direct_booking_inquiry",
      conversationId: conversation?.id,
      guestId: guest.id,
      reservationId: reservation.id,
      source: "public_booking_engine",
    },
    property_id: listing.propertyId,
    status: "pending",
  });

  return {
    reservationId: reservation.id,
    status: reservation.status,
    totalAmount: reservation.total_amount,
  };
}
