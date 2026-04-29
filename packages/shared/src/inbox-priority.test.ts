import { afterEach, describe, expect, it, vi } from "vitest";

import { classifyInboxPriority } from "./inbox-priority";

describe("inbox priority classifier", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("marks access messages near check-in as urgent with reasons", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-29T10:00:00Z"));

    const result = classifyInboxPriority({
      checkInDate: "2026-04-29T18:00:00Z",
      conversationStatus: "pending_team",
      lastMessageBody:
        "No puedo entrar, el codigo de la cerradura no funciona.",
      waitingMinutes: 22,
    });

    expect(result.label).toBe("Urgente");
    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.reasons).toContain(
      "Check-in dentro de las proximas 24 horas.",
    );
  });

  it("keeps low-risk answered conversations below high priority", () => {
    const result = classifyInboxPriority({
      conversationStatus: "pending_guest",
      lastMessageBody: "Gracias por la informacion.",
      waitingMinutes: 3,
    });

    expect(result.label).toBe("Baja");
    expect(result.reasons).toEqual(["Sin senales criticas detectadas."]);
  });
});
