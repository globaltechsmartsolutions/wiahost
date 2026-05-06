import { describe, expect, it } from "vitest";

import {
  PricingMutationError,
  syncPricingObservation,
} from "./pricing";

type PricingObservationRow = {
  approved_price?: number | null;
  currency: string;
  current_price?: number | null;
  final_price?: number | null;
  id: string;
  metadata?: Record<string, unknown> | null;
  observed_for: string;
  property_id: string;
  reservation_id?: string | null;
  source: string;
  suggested_price?: number | null;
};

function createPricingSupabaseMock(
  observation: PricingObservationRow | null,
  options: { syncError?: boolean } = {},
) {
  const inserts: Record<string, unknown[]> = {};
  const updates: Record<string, unknown[]> = {};

  class QueryBuilder {
    private operation: "insert" | "select" | "update" = "select";
    private payload: unknown;

    constructor(private readonly table: string) {}

    eq() {
      return this;
    }

    insert(payload: unknown) {
      this.operation = "insert";
      this.payload = payload;
      inserts[this.table] = inserts[this.table] ?? [];
      inserts[this.table]!.push(payload);
      return this;
    }

    select() {
      return this;
    }

    single() {
      if (this.table === "pricing_observations") {
        return {
          data: observation,
          error: observation ? null : { message: "not found" },
        };
      }

      if (this.table === "channel_sync_events") {
        if (options.syncError) {
          return { data: null, error: { message: "sync failed" } };
        }

        return {
          data: {
            channel: (this.payload as { channel: string }).channel,
            id: "sync-event-1",
            status: (this.payload as { status: string }).status,
          },
          error: null,
        };
      }

      return { data: null, error: null };
    }

    update(payload: unknown) {
      this.operation = "update";
      this.payload = payload;
      updates[this.table] = updates[this.table] ?? [];
      updates[this.table]!.push(payload);
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
    updates,
  };
}

describe("pricing services", () => {
  it("creates outbound price sync events with approved price first", async () => {
    const { inserts, supabase, updates } = createPricingSupabaseMock({
      approved_price: 190,
      currency: "EUR",
      current_price: 160,
      final_price: 185,
      id: "pricing-1",
      metadata: { previous: "metadata" },
      observed_for: "2026-08-05",
      property_id: "property-1",
      reservation_id: "reservation-1",
      source: "airbnb",
      suggested_price: 195,
    });

    const result = await syncPricingObservation(supabase as never, "pricing-1");

    expect(result).toEqual({
      channel: "airbnb",
      id: "sync-event-1",
      status: "pending",
    });
    expect(inserts.channel_sync_events![0]).toMatchObject({
      channel: "airbnb",
      direction: "outbound",
      payload: {
        action: "price_update",
        amount: 190,
        currency: "EUR",
        observationId: "pricing-1",
        observedFor: "2026-08-05",
        reservationId: "reservation-1",
        source: "airbnb",
      },
      property_id: "property-1",
      status: "pending",
    });
    expect(updates.pricing_observations![0]).toMatchObject({
      metadata: {
        lastSyncEventId: "sync-event-1",
        lastSyncStatus: "pending",
        previous: "metadata",
      },
    });
  });

  it("falls back to manual channel when source is not an OTA", async () => {
    const { inserts, supabase } = createPricingSupabaseMock({
      approved_price: null,
      currency: "EUR",
      current_price: 155,
      final_price: null,
      id: "pricing-1",
      metadata: {},
      observed_for: "2026-08-05",
      property_id: "property-1",
      source: "pricelabs",
      suggested_price: null,
    });

    await syncPricingObservation(supabase as never, "pricing-1");

    expect(inserts.channel_sync_events![0]).toMatchObject({
      channel: "manual",
      payload: expect.objectContaining({
        amount: 155,
        source: "pricelabs",
      }),
    });
  });

  it("rejects sync without any usable price", async () => {
    const { inserts, supabase } = createPricingSupabaseMock({
      approved_price: null,
      currency: "EUR",
      current_price: null,
      final_price: null,
      id: "pricing-1",
      metadata: {},
      observed_for: "2026-08-05",
      property_id: "property-1",
      source: "manual",
      suggested_price: null,
    });

    await expect(
      syncPricingObservation(supabase as never, "pricing-1"),
    ).rejects.toMatchObject({
      code: "pricing_sync_price_missing",
    } satisfies Partial<PricingMutationError>);
    expect(inserts.channel_sync_events).toBeUndefined();
  });
});
