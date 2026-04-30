import { afterEach, describe, expect, it } from "vitest";

import { resetRateLimitStoreForTests, takeRateLimitToken } from "./rate-limit";

describe("rate limit", () => {
  afterEach(() => {
    resetRateLimitStoreForTests();
  });

  it("allows requests while there is capacity in the window", () => {
    const rule = { limit: 2, namespace: "test", windowMs: 1000 };

    expect(takeRateLimitToken("ip-1", rule, 1000)).toMatchObject({
      allowed: true,
      remaining: 1,
    });
    expect(takeRateLimitToken("ip-1", rule, 1100)).toMatchObject({
      allowed: true,
      remaining: 0,
    });
  });

  it("blocks when the identity exceeds the configured limit", () => {
    const rule = { limit: 1, namespace: "test", windowMs: 1000 };

    expect(takeRateLimitToken("ip-1", rule, 1000)).toMatchObject({
      allowed: true,
    });
    expect(takeRateLimitToken("ip-1", rule, 1200)).toMatchObject({
      allowed: false,
      retryAfterSeconds: 1,
    });
  });

  it("resets capacity after the window expires", () => {
    const rule = { limit: 1, namespace: "test", windowMs: 1000 };

    expect(takeRateLimitToken("ip-1", rule, 1000)).toMatchObject({
      allowed: true,
    });
    expect(takeRateLimitToken("ip-1", rule, 2001)).toMatchObject({
      allowed: true,
      remaining: 0,
    });
  });

  it("isolates limits by namespace and identity", () => {
    const rule = { limit: 1, namespace: "test-a", windowMs: 1000 };
    const otherRule = { ...rule, namespace: "test-b" };

    takeRateLimitToken("ip-1", rule, 1000);

    expect(takeRateLimitToken("ip-2", rule, 1000)).toMatchObject({
      allowed: true,
    });
    expect(takeRateLimitToken("ip-1", otherRule, 1000)).toMatchObject({
      allowed: true,
    });
  });
});
