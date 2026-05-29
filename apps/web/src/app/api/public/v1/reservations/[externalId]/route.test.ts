import { afterEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => {
  class MockDirectBookingMutationError extends Error {
    code: string;

    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  }

  return {
    DirectBookingMutationError: MockDirectBookingMutationError,
    checkPublicApiPartnerRateLimit: vi.fn(() => ({ ok: true })),
    getDirectBookingInquiryStatus: vi.fn(),
    resolvePublicApiPartner: vi.fn(),
  };
});

vi.mock("@/lib/services/direct-booking", () => ({
  DirectBookingMutationError: routeMocks.DirectBookingMutationError,
  getDirectBookingInquiryStatus: routeMocks.getDirectBookingInquiryStatus,
}));

vi.mock("@/lib/public-api/partners", () => ({
  checkPublicApiPartnerRateLimit: routeMocks.checkPublicApiPartnerRateLimit,
  resolvePublicApiPartner: routeMocks.resolvePublicApiPartner,
}));

import { GET } from "./route";

function request(url: string, headers: HeadersInit = {}) {
  return new Request(url, { headers });
}

function context(externalId: string) {
  return {
    params: Promise.resolve({ externalId }),
  };
}

describe("public reservation status route", () => {
  afterEach(() => {
    routeMocks.getDirectBookingInquiryStatus.mockReset();
    routeMocks.checkPublicApiPartnerRateLimit.mockReset();
    routeMocks.checkPublicApiPartnerRateLimit.mockReturnValue({ ok: true });
    routeMocks.resolvePublicApiPartner.mockReset();
  });

  it("returns the partner reservation status by external id", async () => {
    routeMocks.resolvePublicApiPartner.mockResolvedValue({
      authMode: "local_unsecured",
      ok: true,
      partnerId: "worldinstitutionalassets",
    });
    routeMocks.getDirectBookingInquiryStatus.mockResolvedValue({
      externalReservationId:
        "partner:worldinstitutionalassets:wia-status-001",
      reservationId: "reservation-1",
      status: "inquiry",
    });

    const response = await GET(
      request(
        "https://wiahost.test/api/public/v1/reservations/wia-status-001?partner=worldinstitutionalassets",
      ),
      context("wia-status-001"),
    );

    await expect(response.json()).resolves.toMatchObject({
      authMode: "local_unsecured",
      data: {
        reservationId: "reservation-1",
        status: "inquiry",
      },
      ok: true,
      partner: "worldinstitutionalassets",
    });
    expect(response.status).toBe(200);
    expect(routeMocks.resolvePublicApiPartner).toHaveBeenCalledWith(
      expect.any(Request),
      { requestedPartner: "worldinstitutionalassets" },
    );
    expect(routeMocks.getDirectBookingInquiryStatus).toHaveBeenCalledWith({
      externalId: "wia-status-001",
      partnerId: "worldinstitutionalassets",
    });
  });

  it("decodes URL-encoded external ids before querying", async () => {
    routeMocks.resolvePublicApiPartner.mockResolvedValue({
      authMode: "local_unsecured",
      ok: true,
      partnerId: "worldinstitutionalassets",
    });
    routeMocks.getDirectBookingInquiryStatus.mockResolvedValue({
      reservationId: "reservation-1",
      status: "inquiry",
    });

    await GET(
      request(
        "https://wiahost.test/api/public/v1/reservations/wia%20status%20001?partner=worldinstitutionalassets",
      ),
      context("wia%20status%20001"),
    );

    expect(routeMocks.getDirectBookingInquiryStatus).toHaveBeenCalledWith({
      externalId: "wia status 001",
      partnerId: "worldinstitutionalassets",
    });
  });

  it("requires a partner in local unsecured mode", async () => {
    routeMocks.resolvePublicApiPartner.mockResolvedValue({
      authMode: "local_unsecured",
      ok: true,
      partnerId: "",
    });

    const response = await GET(
      request(
        "https://wiahost.test/api/public/v1/reservations/wia-status-001",
      ),
      context("wia-status-001"),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "public_partner_required",
      },
    });
    expect(routeMocks.getDirectBookingInquiryStatus).not.toHaveBeenCalled();
  });

  it("returns 404 when the external id does not exist for the partner", async () => {
    routeMocks.resolvePublicApiPartner.mockResolvedValue({
      authMode: "local_unsecured",
      ok: true,
      partnerId: "worldinstitutionalassets",
    });
    routeMocks.getDirectBookingInquiryStatus.mockResolvedValue(null);

    const response = await GET(
      request(
        "https://wiahost.test/api/public/v1/reservations/missing?partner=worldinstitutionalassets",
      ),
      context("missing"),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "public_reservation_not_found",
      },
    });
  });

  it("uses configured API keys when they are present", async () => {
    routeMocks.resolvePublicApiPartner.mockResolvedValue({
      authMode: "configured",
      ok: true,
      partnerId: "worldinstitutionalassets",
    });
    routeMocks.getDirectBookingInquiryStatus.mockResolvedValue({
      reservationId: "reservation-1",
      status: "inquiry",
    });

    const response = await GET(
      request(
        "https://wiahost.test/api/public/v1/reservations/wia-status-001?partner=worldinstitutionalassets",
        { "x-wiahost-partner-key": "secret-wia-key" },
      ),
      context("wia-status-001"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      authMode: "configured",
      ok: true,
      partner: "worldinstitutionalassets",
    });
  });
});
