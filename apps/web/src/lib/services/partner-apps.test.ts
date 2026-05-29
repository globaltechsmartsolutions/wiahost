import { describe, expect, it } from "vitest";

import { hashPublicApiKey } from "@/lib/public-api/partners";

import {
  createPartnerApp,
  deletePartnerApp,
  updatePartnerApp,
} from "./partner-apps";

function createPartnerAppsSupabaseMock() {
  const deletes: Record<string, unknown[]> = {};
  const filters: Record<string, unknown[]> = {};
  const inserts: Record<string, unknown[]> = {};
  const updates: Record<string, unknown[]> = {};

  class QueryBuilder {
    private operation: "delete" | "insert" | "select" | "update" = "select";
    private payload: unknown;

    constructor(private readonly table: string) {}

    delete() {
      this.operation = "delete";
      deletes[this.table] = deletes[this.table] ?? [];
      return this;
    }

    eq(column: string, value: unknown) {
      filters[this.table] = filters[this.table] ?? [];
      filters[this.table]!.push({ column, value });
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
      if (this.operation === "delete") {
        return { data: { id: "partner-app-1" }, error: null };
      }

      return {
        data: {
          id: "partner-app-1",
          partner_id: "worldinstitutionalassets",
          status: "active",
        },
        error: null,
      };
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
    deletes,
    filters,
    inserts,
    supabase: {
      from(table: string) {
        expect(table).toBe("partner_apps");
        return new QueryBuilder(table);
      },
    },
    updates,
  };
}

const baseInput = {
  allowedOrigins: ["http://localhost:5500"],
  apiKey: "wia-local-secret-key",
  displayName: "World Institutional Assets",
  notes: "Piloto local",
  partnerId: "worldinstitutionalassets",
  rateLimitPerMinute: 60,
  redirectUrls: ["http://localhost:5500"],
  scopes: ["listings", "availability", "inquiries", "reservations:read"],
  status: "active" as const,
  webhookUrl: undefined,
};

describe("partner app services", () => {
  it("stores partner keys as hashes when creating apps", async () => {
    const { inserts, supabase } = createPartnerAppsSupabaseMock();

    await createPartnerApp(supabase as never, baseInput);

    expect(inserts.partner_apps[0]).toMatchObject({
      key_hash: hashPublicApiKey("wia-local-secret-key"),
      key_prefix: "wia-local-",
      partner_id: "worldinstitutionalassets",
      status: "active",
    });
  });

  it("keeps existing key fields when update does not include a new key", async () => {
    const { supabase, updates } = createPartnerAppsSupabaseMock();

    await updatePartnerApp(supabase as never, "partner-app-1", {
      ...baseInput,
      apiKey: undefined,
      status: "paused",
    });

    expect(updates.partner_apps[0]).toMatchObject({
      partner_id: "worldinstitutionalassets",
      status: "paused",
    });
    expect(updates.partner_apps[0]).not.toHaveProperty("key_hash");
    expect(updates.partner_apps[0]).not.toHaveProperty("key_prefix");
  });

  it("filters by id when deleting apps", async () => {
    const { filters, supabase } = createPartnerAppsSupabaseMock();

    await deletePartnerApp(supabase as never, "partner-app-1");

    expect(filters.partner_apps).toEqual([
      { column: "id", value: "partner-app-1" },
    ]);
  });
});
