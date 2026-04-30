import { useQuery } from "@tanstack/react-query";

import { demoInbox } from "@/src/lib/demo-data";
import { readOfflineCache, writeOfflineCache } from "@/src/lib/offline-cache";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";

type Relation<T> = T | T[] | null | undefined;

export type MobileConversationMessage = {
  body: string;
  channel: string;
  direction: string;
  id: string;
  sentAt: string;
};

export type MobileConversationDetail = {
  cachedAt?: string;
  channel: string;
  guest: string;
  id: string;
  messages: MobileConversationMessage[];
  property: string;
  source: "cache" | "demo" | "live";
  status: string;
  statusValue: string;
  waiting: string;
};

const conversationDetailCacheKey = (conversationId: string) =>
  `conversation-detail-v1:${conversationId}`;

const statusLabels: Record<string, string> = {
  archived: "Archivada",
  open: "Abierta",
  pending_guest: "Pendiente huesped",
  pending_team: "Pendiente equipo",
  resolved: "Resuelta",
};

const channelLabels: Record<string, string> = {
  airbnb: "Airbnb",
  booking: "Booking",
  direct: "Directo",
  email: "Email",
  inbox: "Inbox",
  manual: "Manual",
  sms: "SMS",
  vrbo: "Vrbo",
  whatsapp: "WhatsApp",
};

const directionLabels: Record<string, string> = {
  inbound: "Huesped",
  outbound: "Equipo",
  system: "Sistema",
};

function one<T>(relation: Relation<T>): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation ?? null;
}

function label(value: string | null | undefined) {
  if (!value) {
    return "Pendiente";
  }

  return (
    statusLabels[value] ??
    channelLabels[value] ??
    directionLabels[value] ??
    value
  );
}

function shortDateTime(value: string | null | undefined) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function fallbackConversation(
  conversationId: string,
): MobileConversationDetail | null {
  const thread = demoInbox.find((item) => item.id === conversationId);

  if (!thread) {
    return null;
  }

  return {
    channel: thread.channel,
    guest: thread.guest,
    id: thread.id,
    messages: [
      {
        body: thread.message,
        channel: thread.channel,
        direction: "Huesped",
        id: `${thread.id}-message`,
        sentAt: thread.waiting,
      },
    ],
    property: thread.property,
    source: "demo",
    status: thread.status,
    statusValue: "open",
    waiting: thread.waiting,
  };
}

async function cachedConversation(conversationId: string) {
  const cached = await readOfflineCache<MobileConversationDetail>(
    conversationDetailCacheKey(conversationId),
  );

  if (!cached) {
    return null;
  }

  return {
    ...cached.value,
    cachedAt: cached.savedAt,
    source: "cache" as const,
  };
}

async function loadConversationDetail(
  conversationId: string,
): Promise<MobileConversationDetail | null> {
  if (!isSupabaseConfigured()) {
    return fallbackConversation(conversationId);
  }

  try {
    const [{ data: conversation, error }, { data: messages }] =
      await Promise.all([
        supabase
          .from("conversations")
          .select(
            "id,status,last_message_at,properties(name),guests(full_name),reservations(channel)",
          )
          .eq("id", conversationId)
          .single(),
        supabase
          .from("conversation_messages")
          .select("id,body,channel,direction,sent_at")
          .eq("conversation_id", conversationId)
          .order("sent_at", { ascending: true }),
      ]);

    if (error || !conversation) {
      return fallbackConversation(conversationId);
    }

    const row = conversation as {
      guests?: Relation<{ full_name: string | null }>;
      id: string;
      last_message_at: string | null;
      properties?: Relation<{ name: string | null }>;
      reservations?: Relation<{ channel: string | null }>;
      status: string | null;
    };
    const reservation = one(row.reservations);

    const detail = {
      channel: label(reservation?.channel ?? "inbox"),
      guest: one(row.guests)?.full_name ?? "Contacto sin nombre",
      id: row.id,
      messages: (
        (messages ?? []) as Array<{
          body: string;
          channel: string | null;
          direction: string | null;
          id: string;
          sent_at: string | null;
        }>
      ).map((message) => ({
        body: message.body,
        channel: label(message.channel),
        direction: label(message.direction),
        id: message.id,
        sentAt: shortDateTime(message.sent_at),
      })),
      property: one(row.properties)?.name ?? "Propiedad sin asignar",
      source: "live" as const,
      status: label(row.status),
      statusValue: row.status ?? "open",
      waiting: shortDateTime(row.last_message_at),
    };

    await writeOfflineCache(conversationDetailCacheKey(conversationId), detail);

    return detail;
  } catch {
    return (
      (await cachedConversation(conversationId)) ??
      fallbackConversation(conversationId)
    );
  }
}

export function useConversationDetail(conversationId: string | undefined) {
  return useQuery({
    enabled: Boolean(conversationId),
    queryFn: () => loadConversationDetail(conversationId ?? ""),
    queryKey: ["conversation-detail", conversationId],
  });
}
