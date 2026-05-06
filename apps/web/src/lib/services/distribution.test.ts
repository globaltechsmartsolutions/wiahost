import { describe, expect, it } from "vitest";

import {
  DistributionMutationError,
  importIcalBlocks,
} from "./distribution";

function createDistributionSupabaseMock(
  existingBlocks: Array<{
    end_date: string;
    reason: string;
    start_date: string;
  }> = [],
) {
  const inserts: Record<string, unknown[]> = {};

  class QueryBuilder {
    data: unknown = null;
    error: unknown = null;

    constructor(private readonly table: string) {}

    select() {
      if (this.table === "calendar_blocks") {
        this.data = existingBlocks;
      }

      return this;
    }

    eq() {
      return this;
    }

    gte() {
      return this;
    }

    lte() {
      return this;
    }

    insert(payload: unknown) {
      inserts[this.table] = inserts[this.table] ?? [];
      inserts[this.table]!.push(payload);

      if (this.table === "channel_sync_events") {
        this.data = {
          channel: (payload as { channel: string }).channel,
          id: "sync-event-1",
          status: (payload as { status: string }).status,
        };
      }

      return this;
    }

    single() {
      return this;
    }
  }

  return {
    inserts,
    supabase: {
      from(table: string) {
        return new QueryBuilder(table);
      },
    },
  };
}

describe("distribution services", () => {
  it("imports iCal blocks, skips duplicates and records a sync event", async () => {
    const { inserts, supabase } = createDistributionSupabaseMock([
      {
        end_date: "2026-05-12",
        reason: "iCal Airbnb: Existing reservation",
        start_date: "2026-05-10",
      },
    ]);

    const result = await importIcalBlocks(supabase as never, {
      channel: "airbnb",
      icalText: [
        "BEGIN:VCALENDAR",
        "BEGIN:VEVENT",
        "DTSTART;VALUE=DATE:20260510",
        "DTEND;VALUE=DATE:20260512",
        "SUMMARY:Existing reservation",
        "END:VEVENT",
        "BEGIN:VEVENT",
        "DTSTART;VALUE=DATE:20260515",
        "SUMMARY:Owner block",
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\n"),
      propertyId: "property-1",
      sourceName: "Airbnb",
    });

    expect(result).toEqual({
      imported: 1,
      parsed: 2,
      skipped: 1,
    });
    expect(inserts.calendar_blocks).toEqual([
      [
        {
          end_date: "2026-05-16",
          property_id: "property-1",
          reason: "iCal Airbnb: Owner block",
          source: "airbnb",
          start_date: "2026-05-15",
        },
      ],
    ]);
    expect(inserts.channel_sync_events).toEqual([
      {
        channel: "airbnb",
        direction: "inbound",
        error_message: null,
        listing_id: null,
        payload: {
          action: "ical_import",
          importedEvents: 1,
          parsedEvents: 2,
          skippedDuplicates: 1,
          sourceName: "Airbnb",
        },
        property_id: "property-1",
        status: "synced",
      },
    ]);
  });

  it("rejects iCal imports without valid events", async () => {
    const { supabase } = createDistributionSupabaseMock();

    await expect(
      importIcalBlocks(supabase as never, {
        channel: "booking",
        icalText: "BEGIN:VCALENDAR\nEND:VCALENDAR",
        propertyId: "property-1",
        sourceName: "Booking",
      }),
    ).rejects.toMatchObject({
      code: "ical_import_empty",
    } satisfies Partial<DistributionMutationError>);
  });

  it("deduplicates repeated events inside the same iCal feed", async () => {
    const { inserts, supabase } = createDistributionSupabaseMock();

    const result = await importIcalBlocks(supabase as never, {
      channel: "vrbo",
      icalText: [
        "BEGIN:VCALENDAR",
        "BEGIN:VEVENT",
        "DTSTART;VALUE=DATE:20260520",
        "DTEND;VALUE=DATE:20260522",
        "SUMMARY:VRBO reservation",
        "END:VEVENT",
        "BEGIN:VEVENT",
        "DTSTART;VALUE=DATE:20260520",
        "DTEND;VALUE=DATE:20260522",
        "SUMMARY:VRBO reservation",
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\n"),
      propertyId: "property-1",
      sourceName: "VRBO",
    });

    expect(result).toEqual({
      imported: 1,
      parsed: 2,
      skipped: 1,
    });
    expect(inserts.calendar_blocks).toHaveLength(1);
    expect(inserts.calendar_blocks![0]).toHaveLength(1);
  });

  it("handles folded iCal lines and limits imports to 100 events", async () => {
    const { inserts, supabase } = createDistributionSupabaseMock();
    const yyyymmdd = (offset: number) => {
      const date = new Date("2026-07-01T00:00:00Z");
      date.setUTCDate(date.getUTCDate() + offset);
      return date.toISOString().slice(0, 10).replaceAll("-", "");
    };
    const events = Array.from({ length: 105 }, (_, index) => {
      return [
        "BEGIN:VEVENT",
        `DTSTART;VALUE=DATE:${yyyymmdd(index)}`,
        `DTEND;VALUE=DATE:${yyyymmdd(index + 1)}`,
        "SUMMARY:Very long reservation title that",
        " continues after line folding",
        "END:VEVENT",
      ].join("\n");
    });

    const result = await importIcalBlocks(supabase as never, {
      channel: "booking",
      icalText: ["BEGIN:VCALENDAR", ...events, "END:VCALENDAR"].join("\n"),
      propertyId: "property-1",
      sourceName: "Booking",
    });

    expect(result.parsed).toBe(100);
    expect(result.imported).toBe(100);
    expect(inserts.calendar_blocks![0]).toHaveLength(100);
    expect(
      (inserts.calendar_blocks![0] as Array<{ reason: string }>)[0]!.reason,
    ).toBe("iCal Booking: Very long reservation title thatcontinues after line folding");
  });
});
