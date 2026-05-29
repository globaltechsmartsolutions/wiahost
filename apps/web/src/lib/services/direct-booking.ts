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

type DirectBookingInquiryOptions = {
  idempotencyKey?: string;
  partnerId?: string;
  source?: "partner_channel_api" | "public_booking_engine";
};

type Relation<T> = T | T[] | null | undefined;

type DirectBookingStatusRow = {
  check_in: string;
  check_out: string;
  conversations?: Relation<{
    id: string;
    last_message_at: string | null;
    status: string;
  }>;
  created_at: string;
  external_reservation_id: string | null;
  guests?: Relation<{
    email: string | null;
    full_name: string | null;
    phone: string | null;
  }>;
  guests_count: number;
  id: string;
  properties?: Relation<{
    name: string | null;
  }>;
  source_payload: unknown;
  status: string;
  total_amount: number | string | null;
  updated_at: string;
};

function one<T>(relation: Relation<T>): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation ?? null;
}

export function cleanPartnerExternalId(value: string | undefined, fallback: string) {
  const cleaned = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.:-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

  return cleaned || fallback;
}

export function buildPartnerExternalReservationId(options: {
  externalId?: string;
  partnerId?: string;
}) {
  const externalId = cleanPartnerExternalId(options.externalId, "");

  if (!externalId) {
    return null;
  }

  const partnerId = cleanPartnerExternalId(options.partnerId, "public");

  return `partner:${partnerId}:${externalId}`;
}

async function findExistingInquiry(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  externalReservationId: string | null,
) {
  if (!externalReservationId) {
    return null;
  }

  const { data, error } = await supabase
    .from("reservations")
    .select("id,total_amount,status")
    .eq("channel", "direct")
    .eq("external_reservation_id", externalReservationId)
    .maybeSingle();

  if (error) {
    mutationError(
      "direct_booking_idempotency_lookup_failed",
      "No se ha podido comprobar si la solicitud ya existía.",
    );
  }

  return data;
}

function mapInquiryStatus(row: DirectBookingStatusRow) {
  const guest = one(row.guests);
  const property = one(row.properties);
  const conversation = one(row.conversations);

  return {
    checkIn: row.check_in,
    checkOut: row.check_out,
    conversationId: conversation?.id ?? null,
    conversationStatus: conversation?.status ?? null,
    createdAt: row.created_at,
    externalReservationId: row.external_reservation_id,
    guest: {
      email: guest?.email ?? null,
      fullName: guest?.full_name ?? null,
      phone: guest?.phone ?? null,
    },
    guestsCount: row.guests_count,
    propertyName: property?.name ?? null,
    reservationId: row.id,
    sourcePayload: row.source_payload,
    status: row.status,
    totalAmount: row.total_amount,
    updatedAt: row.updated_at,
  };
}

export async function getDirectBookingInquiryStatus(options: {
  externalId: string;
  partnerId: string;
}) {
  const externalReservationId = buildPartnerExternalReservationId(options);

  if (!externalReservationId) {
    return null;
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("reservations")
    .select(
      "id,external_reservation_id,status,check_in,check_out,guests_count,total_amount,source_payload,created_at,updated_at,properties(name),guests(full_name,email,phone),conversations(id,status,last_message_at)",
    )
    .eq("channel", "direct")
    .eq("external_reservation_id", externalReservationId)
    .maybeSingle();

  if (error) {
    mutationError(
      "direct_booking_status_lookup_failed",
      "No se ha podido consultar el estado de la solicitud.",
    );
  }

  return data ? mapInquiryStatus(data as DirectBookingStatusRow) : null;
}

export async function createDirectBookingInquiry(
  slug: string,
  input: DirectBookingInquiryInput,
  options: DirectBookingInquiryOptions = {},
) {
  const listing = await getPublicBookingListing(slug, {
    partner: options.partnerId,
  });

  if (!listing) {
    mutationError(
      "booking_listing_not_found",
      "No se ha encontrado el anuncio para reservar.",
    );
  }

  const supabase = getSupabaseAdminClient();
  const externalReservationId = buildPartnerExternalReservationId({
    externalId: options.idempotencyKey,
    partnerId: options.partnerId,
  });
  const existingInquiry = await findExistingInquiry(
    supabase,
    externalReservationId,
  );

  if (existingInquiry) {
    return {
      idempotentReplay: true,
      reservationId: existingInquiry.id,
      status: existingInquiry.status,
      totalAmount: existingInquiry.total_amount,
    };
  }

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
  const source = options.source ?? "public_booking_engine";

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
      external_reservation_id: externalReservationId,
      guest_id: guest.id,
      guests_count: input.guestsCount,
      nightly_rate: listing.basePrice,
      notes: message,
      payout_amount: totalAmount,
      property_id: listing.propertyId,
      security_deposit: 0,
      source_payload: {
        externalReservationId,
        idempotencyKey: options.idempotencyKey ?? null,
        listingId: listing.id,
        partnerId: options.partnerId ?? null,
        publicSlug: slug,
        source,
      },
      status: "inquiry",
      taxes_amount: 0,
      total_amount: totalAmount,
    })
    .select("id,total_amount,status")
    .single();

  if (reservationError || !reservation) {
    const existingAfterConflict = await findExistingInquiry(
      supabase,
      externalReservationId,
    );

    if (existingAfterConflict) {
      return {
        idempotentReplay: true,
        reservationId: existingAfterConflict.id,
        status: existingAfterConflict.status,
        totalAmount: existingAfterConflict.total_amount,
      };
    }

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
        partnerId: options.partnerId ?? null,
        source,
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
      externalReservationId,
      guestId: guest.id,
      idempotencyKey: options.idempotencyKey ?? null,
      partnerId: options.partnerId ?? null,
      reservationId: reservation.id,
      source,
    },
    property_id: listing.propertyId,
    status: "pending",
  });

  return {
    idempotentReplay: false,
    reservationId: reservation.id,
    status: reservation.status,
    totalAmount: reservation.total_amount,
  };
}
