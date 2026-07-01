import type { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

export type DirectLeadSyncStatus = "pending" | "confirmed" | "cancelled";

const directLeadSyncStatuses = ["pending", "confirmed", "cancelled"] as const;

export function isDirectLeadSyncStatus(
  status: string,
): status is DirectLeadSyncStatus {
  return directLeadSyncStatuses.includes(status as DirectLeadSyncStatus);
}

export function buildDirectLeadStatusSyncPayload(input: {
  externalReservationId?: string | null;
  reservationId: string;
  status: DirectLeadSyncStatus;
}) {
  return {
    action:
      input.status === "confirmed"
        ? "direct_reservation_confirmed"
        : "direct_lead_status_updated",
    externalReservationId: input.externalReservationId ?? null,
    mode: "local_simulation",
    reservationId: input.reservationId,
    source: "direct_booking_pipeline",
    status: input.status,
    target: "hostaway_bridge_fake",
  };
}

export async function createDirectLeadStatusSyncEvent(
  supabase: SupabaseServerClient,
  input: {
    externalReservationId?: string | null;
    propertyId: string | null;
    reservationId: string;
    status: DirectLeadSyncStatus;
  },
) {
  await supabase.from("channel_sync_events").insert({
    channel: "direct",
    direction: "outbound",
    payload: buildDirectLeadStatusSyncPayload({
      externalReservationId: input.externalReservationId,
      reservationId: input.reservationId,
      status: input.status,
    }),
    property_id: input.propertyId,
    status: "pending",
  });
}
