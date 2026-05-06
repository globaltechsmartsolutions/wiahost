import { describe, expect, it } from "vitest";

import {
  assertPropertyDateRangeAvailable,
  AvailabilityConflictError,
  dateRangesOverlap,
} from "./availability";

type MockTable = "calendar_blocks" | "reservations";

function createAvailabilitySupabaseMock(input: {
  blockConflict?: unknown;
  reservationConflict?: unknown;
}) {
  const filters: Record<string, unknown[]> = {};

  class QueryBuilder {
    constructor(private readonly table: MockTable) {}

    select() {
      return this;
    }

    eq(column: string, value: unknown) {
      filters[this.table] = filters[this.table] ?? [];
      filters[this.table]!.push({ column, op: "eq", value });
      return this;
    }

    gt(column: string, value: unknown) {
      filters[this.table] = filters[this.table] ?? [];
      filters[this.table]!.push({ column, op: "gt", value });
      return this;
    }

    in(column: string, value: unknown) {
      filters[this.table] = filters[this.table] ?? [];
      filters[this.table]!.push({ column, op: "in", value });
      return this;
    }

    limit() {
      return this;
    }

    lt(column: string, value: unknown) {
      filters[this.table] = filters[this.table] ?? [];
      filters[this.table]!.push({ column, op: "lt", value });
      return this;
    }

    neq(column: string, value: unknown) {
      filters[this.table] = filters[this.table] ?? [];
      filters[this.table]!.push({ column, op: "neq", value });
      return this;
    }

    maybeSingle() {
      if (this.table === "reservations") {
        return { data: input.reservationConflict ?? null, error: null };
      }

      return { data: input.blockConflict ?? null, error: null };
    }
  }

  return {
    filters,
    supabase: {
      from(table: MockTable) {
        return new QueryBuilder(table);
      },
    },
  };
}

describe("availability guard", () => {
  it("uses half-open date ranges so checkout day can be reused", () => {
    expect(
      dateRangesOverlap({
        candidateEnd: "2026-05-12",
        candidateStart: "2026-05-10",
        existingEnd: "2026-05-10",
        existingStart: "2026-05-07",
      }),
    ).toBe(false);
    expect(
      dateRangesOverlap({
        candidateEnd: "2026-05-12",
        candidateStart: "2026-05-10",
        existingEnd: "2026-05-11",
        existingStart: "2026-05-09",
      }),
    ).toBe(true);
  });

  it("checks active reservations and calendar blocks with overlap filters", async () => {
    const { filters, supabase } = createAvailabilitySupabaseMock({});

    await assertPropertyDateRangeAvailable(supabase as never, {
      checkIn: "2026-05-10",
      checkOut: "2026-05-12",
      excludeReservationId: "reservation-current",
      propertyId: "property-1",
    });

    expect(filters.reservations).toEqual(
      expect.arrayContaining([
        { column: "property_id", op: "eq", value: "property-1" },
        {
          column: "status",
          op: "in",
          value: ["pending", "confirmed", "checked_in"],
        },
        { column: "check_in", op: "lt", value: "2026-05-12" },
        { column: "check_out", op: "gt", value: "2026-05-10" },
        { column: "id", op: "neq", value: "reservation-current" },
      ]),
    );
    expect(filters.calendar_blocks).toEqual(
      expect.arrayContaining([
        { column: "property_id", op: "eq", value: "property-1" },
        { column: "start_date", op: "lt", value: "2026-05-12" },
        { column: "end_date", op: "gt", value: "2026-05-10" },
      ]),
    );
  });

  it("rejects overlapping active reservations before writes happen", async () => {
    const { supabase } = createAvailabilitySupabaseMock({
      reservationConflict: {
        check_in: "2026-05-11",
        check_out: "2026-05-13",
        id: "reservation-conflict",
        status: "confirmed",
      },
    });

    await expect(
      assertPropertyDateRangeAvailable(supabase as never, {
        checkIn: "2026-05-10",
        checkOut: "2026-05-12",
        propertyId: "property-1",
      }),
    ).rejects.toMatchObject({
      code: "reservation_date_conflict",
    } satisfies Partial<AvailabilityConflictError>);
  });

  it("rejects calendar blocks imported from channel managers", async () => {
    const { supabase } = createAvailabilitySupabaseMock({
      blockConflict: {
        end_date: "2026-05-12",
        id: "block-conflict",
        reason: "iCal Airbnb: Reserved",
        start_date: "2026-05-10",
      },
    });

    await expect(
      assertPropertyDateRangeAvailable(supabase as never, {
        checkIn: "2026-05-10",
        checkOut: "2026-05-12",
        propertyId: "property-1",
      }),
    ).rejects.toMatchObject({
      code: "calendar_block_conflict",
    } satisfies Partial<AvailabilityConflictError>);
  });
});
