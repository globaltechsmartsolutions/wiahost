import { afterEach, describe, expect, it, vi } from "vitest";

import { logApiError } from "./logger";

describe("structured logger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not log expected client errors", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    logApiError({
      code: "validation_error",
      requestId: "req_400",
      status: 400,
    });

    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("logs server errors as structured JSON without payload data", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    logApiError({
      code: "database_unavailable",
      requestId: "req_500",
      status: 503,
    });

    expect(errorSpy).toHaveBeenCalledTimes(1);

    const entry = JSON.parse(String(errorSpy.mock.calls[0]?.[0]));

    expect(entry).toMatchObject({
      code: "database_unavailable",
      event: "api_error",
      level: "error",
      requestId: "req_500",
      service: "wiahost-web",
      status: 503,
    });
    expect(entry).not.toHaveProperty("payload");
    expect(entry).not.toHaveProperty("body");
  });
});
