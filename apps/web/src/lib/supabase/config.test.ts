import { afterEach, describe, expect, it, vi } from "vitest";

import { getSupabasePublicConfig, isSupabaseConfigured } from "./config";

describe("Supabase public config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("detects missing placeholder environment variables", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "replace_with_local_key");

    expect(isSupabaseConfigured()).toBe(false);
    expect(() => getSupabasePublicConfig()).toThrow("Supabase is not configured");
  });

  it("returns the public Supabase config when it is complete", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "demo-anon-key");

    expect(isSupabaseConfigured()).toBe(true);
    expect(getSupabasePublicConfig()).toEqual({
      url: "http://127.0.0.1:54321",
      anonKey: "demo-anon-key",
    });
  });
});
