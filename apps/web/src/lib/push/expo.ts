const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";
const MAX_EXPO_MESSAGES_PER_REQUEST = 100;

export type ExpoPushPriority = "default" | "normal" | "high";

export type ExpoPushMessage = {
  body?: string;
  channelId?: string;
  data?: Record<string, unknown>;
  priority?: ExpoPushPriority;
  sound?: "default";
  title: string;
  to: string;
};

export type ExpoPushTicket = {
  details?: {
    error?: string;
    [key: string]: unknown;
  };
  id?: string;
  message?: string;
  status: "ok" | "error";
};

type ExpoPushApiResponse = {
  data?: ExpoPushTicket[] | ExpoPushTicket;
  errors?: Array<{ code?: string; message?: string }>;
};

type Fetcher = typeof fetch;

export class ExpoPushRequestError extends Error {
  code: string;
  status?: number;

  constructor(code: string, message: string, status?: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function isExpoPushToken(token: string) {
  return /^(ExpoPushToken|ExponentPushToken)\[[^\]]+\]$/.test(token);
}

export function chunkExpoPushMessages<T>(
  messages: T[],
  chunkSize = MAX_EXPO_MESSAGES_PER_REQUEST,
) {
  const chunks: T[][] = [];

  for (let index = 0; index < messages.length; index += chunkSize) {
    chunks.push(messages.slice(index, index + chunkSize));
  }

  return chunks;
}

export function buildExpoPushMessage(input: {
  body?: string | null;
  channelId?: string;
  data?: Record<string, unknown>;
  priority?: ExpoPushPriority;
  title: string;
  token: string;
}): ExpoPushMessage {
  if (!isExpoPushToken(input.token)) {
    throw new ExpoPushRequestError(
      "invalid_expo_push_token",
      "El token push de Expo no tiene un formato valido.",
    );
  }

  return {
    body: input.body?.trim() || undefined,
    channelId: input.channelId,
    data: input.data,
    priority: input.priority ?? "default",
    sound: "default",
    title: input.title.trim(),
    to: input.token,
  };
}

export async function sendExpoPushNotifications(
  messages: ExpoPushMessage[],
  options: {
    accessToken?: string;
    fetcher?: Fetcher;
  } = {},
) {
  if (!messages.length) {
    return { tickets: [] as ExpoPushTicket[] };
  }

  const fetcher = options.fetcher ?? fetch;
  const tickets: ExpoPushTicket[] = [];

  for (const chunk of chunkExpoPushMessages(messages)) {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
      "Content-Type": "application/json",
    };

    if (options.accessToken) {
      headers.Authorization = `Bearer ${options.accessToken}`;
    }

    const response = await fetcher(EXPO_PUSH_ENDPOINT, {
      body: JSON.stringify(chunk),
      headers,
      method: "POST",
    });

    const json = (await response
      .json()
      .catch(() => ({}))) as ExpoPushApiResponse;

    if (!response.ok) {
      const firstError = json.errors?.[0];
      throw new ExpoPushRequestError(
        firstError?.code ?? "expo_push_request_failed",
        firstError?.message ?? "Expo Push Service ha rechazado la peticion.",
        response.status,
      );
    }

    if (json.errors?.length) {
      const firstError = json.errors[0];
      throw new ExpoPushRequestError(
        firstError?.code ?? "expo_push_request_failed",
        firstError?.message ?? "Expo Push Service ha devuelto errores.",
        response.status,
      );
    }

    if (Array.isArray(json.data)) {
      tickets.push(...json.data);
    } else if (json.data) {
      tickets.push(json.data);
    }
  }

  return { tickets };
}
