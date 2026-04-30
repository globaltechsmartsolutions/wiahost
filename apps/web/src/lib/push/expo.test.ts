import { describe, expect, it, vi } from "vitest";

import {
  buildExpoPushMessage,
  chunkExpoPushMessages,
  ExpoPushRequestError,
  isExpoPushToken,
  sendExpoPushNotifications,
} from "./expo";

describe("Expo push helpers", () => {
  it("recognizes current and legacy Expo push token formats", () => {
    expect(isExpoPushToken("ExpoPushToken[abc123]")).toBe(true);
    expect(isExpoPushToken("ExponentPushToken[abc123]")).toBe(true);
    expect(isExpoPushToken("plain-token")).toBe(false);
  });

  it("builds a compact message payload for Expo Push Service", () => {
    const message = buildExpoPushMessage({
      body: " Sofia espera respuesta ",
      data: { route: "/inbox/demo" },
      priority: "high",
      title: "Inbox urgente",
      token: "ExpoPushToken[abc123]",
    });

    expect(message).toMatchObject({
      body: "Sofia espera respuesta",
      data: { route: "/inbox/demo" },
      priority: "high",
      sound: "default",
      title: "Inbox urgente",
      to: "ExpoPushToken[abc123]",
    });
  });

  it("rejects malformed Expo tokens before calling the API", () => {
    expect(() =>
      buildExpoPushMessage({
        title: "Inbox urgente",
        token: "not-a-token",
      }),
    ).toThrow(ExpoPushRequestError);
  });

  it("chunks requests according to Expo's 100 message limit", () => {
    const chunks = chunkExpoPushMessages(Array.from({ length: 205 }, (_, id) => id));

    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toHaveLength(100);
    expect(chunks[2]).toHaveLength(5);
  });

  it("sends messages to the Expo Push Service endpoint", async () => {
    const fetcher = vi.fn(async () =>
      Response.json({
        data: [{ id: "ticket-1", status: "ok" }],
      }),
    );

    const result = await sendExpoPushNotifications(
      [
        buildExpoPushMessage({
          title: "Inbox urgente",
          token: "ExpoPushToken[abc123]",
        }),
      ],
      { accessToken: "secret-token", fetcher },
    );

    expect(result.tickets).toEqual([{ id: "ticket-1", status: "ok" }]);
    expect(fetcher).toHaveBeenCalledWith(
      "https://exp.host/--/api/v2/push/send",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer secret-token",
          "Content-Type": "application/json",
        }),
        method: "POST",
      }),
    );
  });
});
