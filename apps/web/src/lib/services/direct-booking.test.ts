import { afterEach, describe, expect, it, vi } from "vitest";

const directBookingMocks = vi.hoisted(() => ({
  adminClient: null as unknown,
  assertAvailable: vi.fn(),
  listing: {
    address: "Mallorca, Spain",
    amenities: [],
    basePrice: 120,
    bathrooms: 2,
    bedrooms: 3,
    channel: "direct",
    cleaningFee: 30,
    description: "Listing for direct booking tests.",
    externalListingId: "419018",
    houseRules: "No parties.",
    id: "listing-1",
    maxGuests: 4,
    partnerId: "worldinstitutionalassets",
    propertyId: "property-1",
    propertyName: "Enjoy your vacation by the sea",
    slug: "enjoy-your-vacation-by-the-sea",
    syncNotes: "Reserva directa gestionada por WIAHost.",
    thumbnailUrl: "",
    title: "Enjoy your vacation by the sea",
  },
}));

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: () => directBookingMocks.adminClient,
}));

vi.mock("@/lib/data/direct-booking", () => ({
  getPublicBookingListing: vi.fn(() => directBookingMocks.listing),
}));

vi.mock("@/lib/services/availability", () => ({
  assertPropertyDateRangeAvailable: directBookingMocks.assertAvailable,
  AvailabilityConflictError: class AvailabilityConflictError extends Error {
    code: string;

    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  },
}));

import {
  buildPartnerExternalReservationId,
  createDirectBookingInquiry,
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

function createInquirySupabaseMock() {
  const inserts: Record<string, unknown[]> = {};
  const filters: Array<{ column: string; table: string; value: unknown }> = [];

  class QueryBuilder {
    private inserted = false;

    constructor(private table: string) {}

    insert(payload: unknown) {
      this.inserted = true;
      inserts[this.table] = [...(inserts[this.table] ?? []), payload];
      return this;
    }

    select() {
      return this;
    }

    eq(column: string, value: unknown) {
      filters.push({ column, table: this.table, value });
      return this;
    }

    maybeSingle() {
      return {
        data: null,
        error: null,
      };
    }

    single() {
      if (this.table === "guests" && this.inserted) {
        return {
          data: { id: "guest-1" },
          error: null,
        };
      }

      if (this.table === "reservations" && this.inserted) {
        return {
          data: {
            id: "reservation-1",
            status: "inquiry",
            total_amount: 390,
          },
          error: null,
        };
      }

      if (this.table === "conversations" && this.inserted) {
        return {
          data: { id: "conversation-1" },
          error: null,
        };
      }

      return {
        data: null,
        error: null,
      };
    }
  }

  return {
    filters,
    inserts,
    supabase: {
      from(table: string) {
        return new QueryBuilder(table);
      },
    },
  };
}

describe("direct booking partner identity", () => {
  afterEach(() => {
    directBookingMocks.adminClient = null;
    directBookingMocks.assertAvailable.mockReset();
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

describe("direct booking inquiry pipeline", () => {
  afterEach(() => {
    directBookingMocks.adminClient = null;
    directBookingMocks.assertAvailable.mockReset();
  });

  it("stores an already-ingested direct inquiry sync event as synced", async () => {
    const { inserts, supabase } = createInquirySupabaseMock();
    directBookingMocks.adminClient = supabase;

    await expect(
      createDirectBookingInquiry("enjoy-your-vacation-by-the-sea", {
        checkIn: "2034-11-12",
        checkOut: "2034-11-15",
        consent: true,
        guestEmail: "guest@example.test",
        guestFullName: "Guest Example",
        guestPhone: "+34 600 000 001",
        guestsCount: 2,
        message: "Please confirm availability.",
      }),
    ).resolves.toMatchObject({
      idempotentReplay: false,
      reservationId: "reservation-1",
      status: "inquiry",
      totalAmount: 390,
    });

    expect(inserts.guests).toHaveLength(1);
    expect(inserts.reservations).toHaveLength(1);
    expect(inserts.conversations).toHaveLength(1);
    expect(inserts.conversation_messages).toHaveLength(1);
    expect(inserts.operational_events).toEqual([
      expect.objectContaining({
        actor_type: "system",
        conversation_id: "conversation-1",
        entity_id: "reservation-1",
        entity_type: "reservation",
        event_name: "direct_booking.inquiry_received",
        property_id: "property-1",
        reservation_id: "reservation-1",
      }),
    ]);
    expect(inserts.channel_sync_events).toEqual([
      expect.objectContaining({
        channel: "direct",
        direction: "inbound",
        status: "synced",
        payload: expect.objectContaining({
          action: "direct_booking_inquiry",
          conversationId: "conversation-1",
          reservationId: "reservation-1",
          source: "public_booking_engine",
        }),
      }),
    ]);
  });
});
