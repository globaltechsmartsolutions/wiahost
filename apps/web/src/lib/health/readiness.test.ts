import { afterEach, describe, expect, it, vi } from "vitest";

import { getReadinessSnapshot } from "./readiness";

describe("readiness snapshot", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reports local configuration warnings without exposing secret values", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3002");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "replace_with_local_key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "replace_with_service_role_key");
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");

    const snapshot = await getReadinessSnapshot({ checkDatabase: false });
    const supabaseCheck = snapshot.checks.find(
      (check) => check.key === "supabase_public",
    );
    const databaseCheck = snapshot.checks.find(
      (check) => check.key === "database",
    );

    expect(snapshot.app).toBe("wiahost");
    expect(snapshot.status).toBe("ok");
    expect(supabaseCheck?.status).toBe("warning");
    expect(databaseCheck?.status).toBe("skipped");
    expect(JSON.stringify(snapshot)).not.toContain(
      "replace_with_service_role_key",
    );
  });

  it("warns when Stripe Checkout has no webhook secret", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3002");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "demo-anon-key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "demo-service-role-key");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_demo");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");

    const snapshot = await getReadinessSnapshot({ checkDatabase: false });
    const stripeCheck = snapshot.checks.find(
      (check) => check.key === "stripe_checkout",
    );

    expect(stripeCheck?.status).toBe("warning");
    expect(stripeCheck?.message).toContain("STRIPE_WEBHOOK_SECRET");
  });
});
