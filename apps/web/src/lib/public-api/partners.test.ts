import { afterEach, describe, expect, it, vi } from "vitest";

const partnerResolverMocks = vi.hoisted(() => ({
  adminClient: null as unknown,
  supabaseConfigured: false,
}));

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: () => partnerResolverMocks.adminClient,
}));

vi.mock("@/lib/supabase/config", () => ({
  isSupabaseConfigured: () => partnerResolverMocks.supabaseConfigured,
}));

import { resetRateLimitStoreForTests } from "@/lib/security/rate-limit";

import {
  checkPublicApiPartnerRateLimit,
  hashPublicApiKey,
  resolvePublicApiPartner,
} from "./partners";

type PartnerAppRow = {
  key_hash: string;
  partner_id: string;
  rate_limit_per_minute?: number | null;
  status: string;
};

function request(headers: HeadersInit = {}) {
  return new Request("https://wiahost.test/api/public/v1/listings", {
    headers,
  });
}

function createPartnerAppsSupabaseMock(rows: PartnerAppRow[]) {
  class QueryBuilder {
    private filters: Array<{ column: string; value: unknown }> = [];

    select() {
      return this;
    }

    eq(column: string, value: unknown) {
      this.filters.push({ column, value });
      return this;
    }

    limit() {
      return this;
    }

    maybeSingle() {
      const row =
        rows.find((candidate) =>
          this.filters.every(
            (filter) =>
              candidate[filter.column as keyof PartnerAppRow] ===
              filter.value,
          ),
        ) ?? null;

      return {
        data: row
          ? {
              partner_id: row.partner_id,
              rate_limit_per_minute: row.rate_limit_per_minute ?? 120,
              status: row.status,
            }
          : null,
        error: null,
      };
    }
  }

  return {
    from(table: string) {
      expect(table).toBe("partner_apps");
      return new QueryBuilder();
    },
  };
}

describe("public API partner resolver", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    partnerResolverMocks.adminClient = null;
    partnerResolverMocks.supabaseConfigured = false;
    resetRateLimitStoreForTests();
  });

  it("uses local unsecured mode when no partner keys are configured", async () => {
    vi.stubEnv("WIAHOST_PUBLIC_API_KEYS", "");

    await expect(
      resolvePublicApiPartner(request(), {
        requestedPartner: "worldinstitutionalassets",
      }),
    ).resolves.toEqual({
      authMode: "local_unsecured",
      ok: true,
      partnerId: "worldinstitutionalassets",
      rateLimitPerMinute: 120,
    });
  });

  it("accepts a configured partner key from the dedicated header", async () => {
    vi.stubEnv(
      "WIAHOST_PUBLIC_API_KEYS",
      "worldinstitutionalassets:secret-wia-key",
    );

    await expect(
      resolvePublicApiPartner(
        request({ "x-wiahost-partner-key": "secret-wia-key" }),
        { requestedPartner: "worldinstitutionalassets" },
      ),
    ).resolves.toEqual({
      authMode: "configured",
      ok: true,
      partnerId: "worldinstitutionalassets",
      rateLimitPerMinute: 120,
    });
  });

  it("accepts bearer tokens and preserves secrets with colon characters", async () => {
    vi.stubEnv(
      "WIAHOST_PUBLIC_API_KEYS",
      "worldinstitutionalassets:key:with:colon",
    );

    await expect(
      resolvePublicApiPartner(
        request({ authorization: "Bearer key:with:colon" }),
        { requestedPartner: "worldinstitutionalassets" },
      ),
    ).resolves.toEqual({
      authMode: "configured",
      ok: true,
      partnerId: "worldinstitutionalassets",
      rateLimitPerMinute: 120,
    });
  });

  it("accepts active partner apps stored in the database", async () => {
    vi.stubEnv("WIAHOST_PUBLIC_API_KEYS", "");
    partnerResolverMocks.supabaseConfigured = true;
    partnerResolverMocks.adminClient = createPartnerAppsSupabaseMock([
      {
        key_hash: hashPublicApiKey("db-secret-key"),
        partner_id: "externalwebsite",
        rate_limit_per_minute: 7,
        status: "active",
      },
    ]);

    await expect(
      resolvePublicApiPartner(
        request({ "x-wiahost-partner-key": "db-secret-key" }),
        { requestedPartner: "externalwebsite" },
      ),
    ).resolves.toEqual({
      authMode: "partner_app",
      ok: true,
      partnerId: "externalwebsite",
      rateLimitPerMinute: 7,
    });
  });

  it("rate limits public API calls by partner identity", () => {
    const first = checkPublicApiPartnerRateLimit(
      request({ "x-forwarded-for": "1.1.1.1" }),
      {
        authMode: "partner_app",
        ok: true,
        partnerId: "externalwebsite",
        rateLimitPerMinute: 1,
      },
      "public_partner_test",
    );
    const secondFromOtherIp = checkPublicApiPartnerRateLimit(
      request({ "x-forwarded-for": "2.2.2.2" }),
      {
        authMode: "partner_app",
        ok: true,
        partnerId: "externalwebsite",
        rateLimitPerMinute: 1,
      },
      "public_partner_test",
    );

    expect(first.ok).toBe(true);
    expect(secondFromOtherIp.ok).toBe(false);
  });

  it("requires a key when active partner apps exist", async () => {
    vi.stubEnv("WIAHOST_PUBLIC_API_KEYS", "");
    partnerResolverMocks.supabaseConfigured = true;
    partnerResolverMocks.adminClient = createPartnerAppsSupabaseMock([
      {
        key_hash: hashPublicApiKey("db-secret-key"),
        partner_id: "externalwebsite",
        status: "active",
      },
    ]);

    const result = await resolvePublicApiPartner(request(), {
      requestedPartner: "externalwebsite",
    });

    expect(result.ok).toBe(false);

    if (result.ok) {
      throw new Error("Expected partner resolution to fail.");
    }

    expect(result.response.status).toBe(401);
    await expect(result.response.json()).resolves.toMatchObject({
      error: {
        code: "public_partner_auth_required",
      },
    });
  });

  it("rejects keys from another partner", async () => {
    vi.stubEnv(
      "WIAHOST_PUBLIC_API_KEYS",
      "worldinstitutionalassets:secret-wia-key,otherpartner:other-key",
    );

    const result = await resolvePublicApiPartner(
      request({ "x-wiahost-partner-key": "other-key" }),
      { requestedPartner: "worldinstitutionalassets" },
    );

    expect(result.ok).toBe(false);

    if (result.ok) {
      throw new Error("Expected partner resolution to fail.");
    }

    expect(result.response.status).toBe(403);
    await expect(result.response.json()).resolves.toMatchObject({
      error: {
        code: "public_partner_forbidden",
      },
    });
  });
});
