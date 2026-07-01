import type { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

type AvailabilityInput = {
  checkIn: string;
  checkOut: string;
  excludeReservationId?: string;
  propertyId: string;
};

export class AvailabilityConflictError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function availabilityError(code: string, message: string): never {
  throw new AvailabilityConflictError(code, message);
}

export const blockingReservationStatuses = [
  "pending",
  "confirmed",
  "checked_in",
] as const;

export function isBlockingReservationStatus(status: string) {
  return blockingReservationStatuses.includes(
    status as (typeof blockingReservationStatuses)[number],
  );
}

export function dateRangesOverlap(input: {
  candidateEnd: string;
  candidateStart: string;
  existingEnd: string;
  existingStart: string;
}) {
  return (
    input.existingStart < input.candidateEnd &&
    input.existingEnd > input.candidateStart
  );
}

export async function assertPropertyDateRangeAvailable(
  supabase: SupabaseServerClient,
  input: AvailabilityInput,
) {
  if (input.checkOut <= input.checkIn) {
    availabilityError(
      "invalid_date_range",
      "La salida debe ser posterior a la entrada.",
    );
  }

  let reservationQuery = supabase
    .from("reservations")
    .select("id,check_in,check_out,status")
    .eq("property_id", input.propertyId)
    .in("status", [...blockingReservationStatuses])
    .lt("check_in", input.checkOut)
    .gt("check_out", input.checkIn)
    .limit(1);

  if (input.excludeReservationId) {
    reservationQuery = reservationQuery.neq("id", input.excludeReservationId);
  }

  const { data: conflictingReservation, error: reservationError } =
    await reservationQuery.maybeSingle();

  if (reservationError) {
    availabilityError(
      "availability_check_failed",
      "No se ha podido comprobar la disponibilidad de la vivienda.",
    );
  }

  if (conflictingReservation) {
    availabilityError(
      "reservation_date_conflict",
      "La vivienda ya tiene una reserva activa o pendiente en esas fechas.",
    );
  }

  const { data: conflictingBlock, error: blockError } = await supabase
    .from("calendar_blocks")
    .select("id,reason,start_date,end_date")
    .eq("property_id", input.propertyId)
    .lt("start_date", input.checkOut)
    .gt("end_date", input.checkIn)
    .limit(1)
    .maybeSingle();

  if (blockError) {
    availabilityError(
      "availability_check_failed",
      "No se han podido comprobar los bloqueos de calendario.",
    );
  }

  if (conflictingBlock) {
    availabilityError(
      "calendar_block_conflict",
      "La vivienda tiene un bloqueo de calendario en esas fechas.",
    );
  }
}
