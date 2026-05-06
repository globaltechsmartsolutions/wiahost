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

  it("sends large batches in multiple Expo-compliant requests", async () => {
    const fetcher = vi.fn(async () =>
      Response.json({
        data: [{ id: "ticket", status: "ok" }],
      }),
    );
    const messages = Array.from({ length: 205 }, (_, index) =>
      buildExpoPushMessage({
        title: `Operacion ${index}`,
        token: `ExpoPushToken[token-${index}]`,
      }),
    );

    await sendExpoPushNotifications(messages, { fetcher });

    const firstRequest = fetcher.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    const thirdRequest = fetcher.mock.calls[2] as unknown as [
      string,
      RequestInit,
    ];

    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(JSON.parse(firstRequest[1].body as string)).toHaveLength(100);
    expect(JSON.parse(thirdRequest[1].body as string)).toHaveLength(5);
  });

  it("surfaces Expo ticket errors such as DeviceNotRegistered", async () => {
    const fetcher = vi.fn(async () =>
      Response.json({
        data: [
          {
            details: { error: "DeviceNotRegistered" },
            message: "Device is not registered",
            status: "error",
          },
        ],
      }),
    );

    const result = await sendExpoPushNotifications(
      [
        buildExpoPushMessage({
          title: "Inbox urgente",
          token: "ExpoPushToken[dead-device]",
        }),
      ],
      { fetcher },
    );

    expect(result.tickets).toEqual([
      {
        details: { error: "DeviceNotRegistered" },
        message: "Device is not registered",
        status: "error",
      },
    ]);
  });

  it("throws when Expo rejects the whole request", async () => {
    const fetcher = vi.fn(async () =>
      Response.json(
        {
          errors: [{ code: "TOO_MANY_REQUESTS", message: "Slow down" }],
        },
        { status: 429 },
      ),
    );

    await expect(
      sendExpoPushNotifications(
        [
          buildExpoPushMessage({
            title: "Inbox urgente",
            token: "ExpoPushToken[abc123]",
          }),
        ],
        { fetcher },
      ),
    ).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
      status: 429,
    } satisfies Partial<ExpoPushRequestError>);
  });
});
