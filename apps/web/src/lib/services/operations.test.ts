import { describe, expect, it } from "vitest";

import { buildDirectLeadStatusSyncPayload } from "./operations";

describe("operations service", () => {
  it("builds the local outbound sync payload when a direct lead is confirmed", () => {
    expect(
      buildDirectLeadStatusSyncPayload({
        externalReservationId: "partner:worldinstitutionalassets:wia-001",
        reservationId: "reservation-1",
        status: "confirmed",
      }),
    ).toEqual({
      action: "direct_reservation_confirmed",
      externalReservationId: "partner:worldinstitutionalassets:wia-001",
      mode: "local_simulation",
      reservationId: "reservation-1",
      source: "direct_booking_pipeline",
      status: "confirmed",
      target: "hostaway_bridge_fake",
    });
  });

  it("builds direct lead status payloads for pending and cancelled leads", () => {
    expect(
      buildDirectLeadStatusSyncPayload({
        reservationId: "reservation-1",
        status: "pending",
      }),
    ).toMatchObject({
      action: "direct_lead_status_updated",
      externalReservationId: null,
      reservationId: "reservation-1",
      status: "pending",
    });

    expect(
      buildDirectLeadStatusSyncPayload({
        reservationId: "reservation-1",
        status: "cancelled",
      }),
    ).toMatchObject({
      action: "direct_lead_status_updated",
      externalReservationId: null,
      reservationId: "reservation-1",
      status: "cancelled",
    });
  });
});
