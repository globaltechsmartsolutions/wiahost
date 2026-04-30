import { describe, expect, it } from "vitest";
import { z } from "zod";

import { apiError, validationError } from "./responses";

describe("API responses", () => {
  it("returns consistent JSON errors with a request id header", async () => {
    const response = apiError(
      "demo_error",
      "Algo ha fallado.",
      418,
      "req_test_123",
    );

    await expect(response.json()).resolves.toEqual({
      error: {
        code: "demo_error",
        message: "Algo ha fallado.",
        requestId: "req_test_123",
      },
    });
    expect(response.status).toBe(418);
    expect(response.headers.get("X-Request-Id")).toBe("req_test_123");
  });

  it("keeps validation errors traceable", async () => {
    const schema = z.object({ email: z.email("Email invalido.") });
    const parsed = schema.safeParse({ email: "nope" });

    if (parsed.success) {
      throw new Error("Expected validation to fail.");
    }

    const response = validationError(parsed.error, "req_validation_123");

    await expect(response.json()).resolves.toEqual({
      error: {
        code: "validation_error",
        message: "Email invalido.",
        requestId: "req_validation_123",
      },
    });
    expect(response.headers.get("X-Request-Id")).toBe("req_validation_123");
  });
});
