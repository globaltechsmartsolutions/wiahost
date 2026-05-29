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
});
