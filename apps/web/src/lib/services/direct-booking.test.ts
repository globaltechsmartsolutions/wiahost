import { afterEach, describe, expect, it, vi } from "vitest";

const directBookingMocks = vi.hoisted(() => ({
  adminClient: null as unknown,
}));

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: () => directBookingMocks.adminClient,
}));

import {
  buildPartnerExternalReservationId,
  DirectBookingMutationError,
  getDirectBookingInquiryStatus,
} from "./direct-booking";

type StatusRow = {
  check_in: string;
  check_out: string;
  conversations?: unknown;
  created_at: string;
  external_reservation_id: string | null;
  guests?: unknown;
  guests_count: number;
  id: string;
  properties?: unknown;
  source_payload: unknown;
  status: string;
  total_amount: number;
  updated_at: string;
};

function createStatusSupabaseMock(input: {
  error?: unknown;
  row?: StatusRow | null;
}) {
  const filters: Array<{ column: string; value: unknown }> = [];

  class QueryBuilder {
    select() {
      return this;
    }

    eq(column: string, value: unknown) {
      filters.push({ column, value });
      return this;
    }

    maybeSingle() {
      return {
        data: input.row ?? null,
        error: input.error ?? null,
      };
    }
  }

  return {
    filters,
    supabase: {
      from(table: string) {
        expect(table).toBe("reservations");
        return new QueryBuilder();
      },
    },
  };
}

describe("direct booking partner identity", () => {
  afterEach(() => {
    directBookingMocks.adminClient = null;
  });

  it("builds stable partner-scoped external reservation ids", () => {
    expect(
      buildPartnerExternalReservationId({
        externalId: " WIA Local Status 001 ",
        partnerId: "World Institutional Assets",
      }),
    ).toBe("partner:world-institutional-assets:wia-local-status-001");
  });

  it("returns null when the external id is empty", () => {
    expect(
      buildPartnerExternalReservationId({
        externalId: "  ",
        partnerId: "worldinstitutionalassets",
      }),
    ).toBeNull();
  });

  it("queries a status by partner-scoped external id", async () => {
    const row: StatusRow = {
      check_in: "2027-02-10",
      check_out: "2027-02-13",
      conversations: {
        id: "conversation-1",
        last_message_at: "2026-05-29T10:22:07.000Z",
        status: "open",
      },
      created_at: "2026-05-29T10:22:07.000Z",
      external_reservation_id:
        "partner:worldinstitutionalassets:wia-status-001",
      guests: {
        email: "estado@example.com",
        full_name: "Estado WIA",
        phone: "+34600000000",
      },
      guests_count: 2,
      id: "reservation-1",
      properties: {
        name: "Enjoy your vacation by the sea",
      },
      source_payload: {
        source: "partner_channel_api",
      },
      status: "inquiry",
      total_amount: 792,
      updated_at: "2026-05-29T10:22:07.000Z",
    };
    const { filters, supabase } = createStatusSupabaseMock({ row });

    directBookingMocks.adminClient = supabase;

    await expect(
      getDirectBookingInquiryStatus({
        externalId: "wia-status-001",
        partnerId: "worldinstitutionalassets",
      }),
    ).resolves.toMatchObject({
      conversationId: "conversation-1",
      externalReservationId:
        "partner:worldinstitutionalassets:wia-status-001",
      guest: {
        email: "estado@example.com",
        fullName: "Estado WIA",
      },
      propertyName: "Enjoy your vacation by the sea",
      reservationId: "reservation-1",
      status: "inquiry",
    });

    expect(filters).toEqual(
      expect.arrayContaining([
        { column: "channel", value: "direct" },
        {
          column: "external_reservation_id",
          value: "partner:worldinstitutionalassets:wia-status-001",
        },
      ]),
    );
  });

  it("returns null when the external id does not exist", async () => {
    const { supabase } = createStatusSupabaseMock({ row: null });

    directBookingMocks.adminClient = supabase;

    await expect(
      getDirectBookingInquiryStatus({
        externalId: "missing",
        partnerId: "worldinstitutionalassets",
      }),
    ).resolves.toBeNull();
  });

  it("raises a typed mutation error when status lookup fails", async () => {
    const { supabase } = createStatusSupabaseMock({
      error: { message: "database is down" },
    });

    directBookingMocks.adminClient = supabase;

    await expect(
      getDirectBookingInquiryStatus({
        externalId: "wia-status-001",
        partnerId: "worldinstitutionalassets",
      }),
    ).rejects.toMatchObject({
      code: "direct_booking_status_lookup_failed",
    } satisfies Partial<DirectBookingMutationError>);
  });
});
